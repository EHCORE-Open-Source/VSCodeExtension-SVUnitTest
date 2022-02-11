import { count } from 'console';
import * as vscode from 'vscode';
import { getContentFromFilesystem, MarkdownTestData, TestCase, TestCaseResult, testData, TestFile } from './testTree';
import { execShellCommand } from './vscutil_content';

export async function activate(context: vscode.ExtensionContext) {
  const ctrl = vscode.tests.createTestController('SVUnitTestController', 'SVUnit Test');
  context.subscriptions.push(ctrl);

  const runHandler = (request: vscode.TestRunRequest, cancellation: vscode.CancellationToken) => {
    const queue: { test: vscode.TestItem; data: TestCase; testCaseResult: TestCaseResult; duration: number }[] = [];
    const run = ctrl.createTestRun(request);
    // map of file uris to statments on each line:
    const coveredLines = new Map</* file uri */ string, (vscode.StatementCoverage | undefined)[]>();

    const discoverTests = async (tests: Iterable<vscode.TestItem>, testResult: TestCaseResult[], duration: any) => {
      for (const test of tests) {
        if (request.exclude?.includes(test)) {
          continue;
        }

        const data = testData.get(test);
        if (data instanceof TestCase) {
          run.enqueued(test);
          if (testResult.length < 1) {
            const start = Date.now();
            testResult = await execShellCommand();
            //SVUnite 執行的時間
            duration = Date.now() - start;
          }

          //找到該測試項目，加到 queue
          const testCaseResult = testResult.find(n => n.item == test.label);
          if (testCaseResult)
            queue.push({ test, data, testCaseResult, duration });

        } else {
          //data是檔案，且data.didResolve為false執行
          if (data instanceof TestFile && !data.didResolve) {
            //從硬碟更新
            await data.updateFromDisk(ctrl, test);
          }

          const start = Date.now();
          const testResult = await execShellCommand();
          //SVUnite 執行的時間
          duration = (Date.now() - start) / testResult.length;
          //遞回，回到 discoverTests，執行其子測試項目
          await discoverTests(gatherTestItems(test.children), testResult, duration);
        }

        if (test.uri && !coveredLines.has(test.uri.toString())) {
          try {
            const lines = (await getContentFromFilesystem(test.uri)).split('\n');
            coveredLines.set(
              test.uri.toString(),
              lines.map((lineText, lineNo) =>
                lineText.trim().length ? new vscode.StatementCoverage(0, new vscode.Position(lineNo, 0)) : undefined
              )
            );
          } catch {
            // ignored
          }
        }
      }
    };

    const runTestQueue = async () => {
      for (const { test, data, testCaseResult, duration } of queue) {
        run.appendOutput(`Running ${test.id}\r\n`);
        if (cancellation.isCancellationRequested) {
          run.skipped(test);
        } else {
          run.started(test);
          await data.run(test, run, testCaseResult, duration);
        }

        const lineNo = test.range!.start.line;
        const fileCoverage = coveredLines.get(test.uri!.toString());
        if (fileCoverage) {
          fileCoverage[lineNo]!.executionCount++;
        }

        run.appendOutput(`Completed ${test.id}\r\n`);
      }

      run.end();
    };

    run.coverageProvider = {
      provideFileCoverage() {
        const coverage: vscode.FileCoverage[] = [];
        for (const [uri, statements] of coveredLines) {
          coverage.push(
            vscode.FileCoverage.fromDetails(
              vscode.Uri.parse(uri),
              statements.filter((s): s is vscode.StatementCoverage => !!s)
            )
          );
        }

        return coverage;
      },
    };

    discoverTests(request.include ?? gatherTestItems(ctrl.items), [], null).then(runTestQueue);
  };

  ctrl.refreshHandler = async () => {
    await Promise.all(getWorkspaceTestPatterns().map(({ pattern }) => findInitialFiles(ctrl, pattern)));
  };

  ctrl.createRunProfile('Run Tests', vscode.TestRunProfileKind.Run, runHandler, false);

  ctrl.resolveHandler = async item => {
    if (!item) {
      context.subscriptions.push(...startWatchingWorkspace(ctrl));
      return;
    }

    const data = testData.get(item);
    if (data instanceof TestFile) {
      await data.updateFromDisk(ctrl, item);
    }
  };

  function updateNodeForDocument(e: vscode.TextDocument) {
    if (e.uri.scheme !== 'file') {
      return;
    }

    if (!e.uri.path.endsWith('_unit_test.sv')) {
      return;
    }

    // 取得或建立測試的檔案
    const { file, data } = getOrCreateFile(ctrl, e.uri);
    // 呼叫 TestFile 類別的 updateFromContents 從內容更新
    data.updateFromContents(ctrl, e.getText(), file);
  }

  for (const document of vscode.workspace.textDocuments) {
    updateNodeForDocument(document);
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(updateNodeForDocument),
    vscode.workspace.onDidChangeTextDocument(e => updateNodeForDocument(e.document)),
  );
}

// 取得或建立測試的檔案
function getOrCreateFile(controller: vscode.TestController, uri: vscode.Uri) {
  //取得該路徑 "最上層" TestItem 實例的集合
  const existing = controller.items.get(uri.toString());
  //existing有資料的話 return 其內容
  if (existing) {
    return { file: existing, data: testData.get(existing) as TestFile };
  }

  // 建立 TestItem 實例，
  // 這裡 ID 是檔案路徑，標籤是檔名，uri 為與此 TestItem 關聯的 uri。
  const file = controller.createTestItem(uri.toString(), uri.path.split('/').pop()!, uri);
  // 把變數 file 加到 TestController
  controller.items.add(file);

  const data = new TestFile();
  //TestItem 介面很簡單，沒有空間容納自定義數據。 
  //如果需要將額外資訊與 TestItem 相關聯，可以使用 WeakMap
  //testData是WeakMap的set函數
  //WeakMap.prototype.set(key, value)：在 WeakMap 中設置一組key關聯物件，返回這個 WeakMap 物件。
  testData.set(file, data);

  // 用來控制發現測試
  file.canResolveChildren = true;
  return { file, data };
}

function gatherTestItems(collection: vscode.TestItemCollection) {
  const items: vscode.TestItem[] = [];
  collection.forEach(item => items.push(item));
  return items;
}

function getWorkspaceTestPatterns() {
  if (!vscode.workspace.workspaceFolders) {
    return [];
  }

  return vscode.workspace.workspaceFolders.map(workspaceFolder => ({
    workspaceFolder,
    pattern: new vscode.RelativePattern(workspaceFolder, '**/*_unit_test.sv'),
  }));
}

async function findInitialFiles(controller: vscode.TestController, pattern: vscode.GlobPattern) {
  for (const file of await vscode.workspace.findFiles(pattern)) {
    getOrCreateFile(controller, file);
  }
}

function startWatchingWorkspace(controller: vscode.TestController) {
  return getWorkspaceTestPatterns().map(({ workspaceFolder, pattern }) => {
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);

    watcher.onDidCreate(uri => getOrCreateFile(controller, uri));
    watcher.onDidChange(uri => {
      const { file, data } = getOrCreateFile(controller, uri);
      if (data.didResolve) {
        data.updateFromDisk(controller, file);
      }
    });
    watcher.onDidDelete(uri => controller.items.delete(uri.toString()));

    findInitialFiles(controller, pattern);

    return watcher;
  });
}
