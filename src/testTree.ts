import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import { parseMarkdown } from './parser';

const textDecoder = new TextDecoder('utf-8');

export type MarkdownTestData = TestFile | TestHeading | TestCase;

export const testData = new WeakMap<vscode.TestItem, MarkdownTestData>();

let generationCounter = 0;

export const getContentFromFilesystem = async (uri: vscode.Uri) => {
  try {
    const rawContent = await vscode.workspace.fs.readFile(uri);
    return textDecoder.decode(rawContent);
  } catch (e) {
    console.warn(`Error providing tests for ${uri.fsPath}`, e);
    return '';
  }
};

export class TestFile {
  public didResolve = false;

  public async updateFromDisk(controller: vscode.TestController, item: vscode.TestItem) {
    try {
      const content = await getContentFromFilesystem(item.uri!);
      item.error = undefined;
      this.updateFromContents(controller, content, item);
    } catch (e) {
      item.error = (e as Error).stack;
    }
  }

  /**
   * Parses the tests from the input text, and updates the tests contained
   * by this file to be those from the text,
   */
  public updateFromContents(controller: vscode.TestController, content: string, item: vscode.TestItem) {
    const ancestors = [{ item, children: [] as vscode.TestItem[] }];
    const thisGeneration = generationCounter++;
    this.didResolve = true;

    const ascend = (depth: number) => {
      //把 ancestors 的資料取出後加到測試項的子項，直到取完 ancestors 資料
      while (ancestors.length > depth) {
        //從陣列中刪除最後一個元素並返回它。如果陣列為空，則返回 undefined 並且不修改陣列。
        const finished = ancestors.pop()!;
        //替換測試項的子項內容
        finished.item.children.replace(finished.children);
      }
    };

    parseMarkdown(content, {
      onTest: (range, name) => {
        const parent = ancestors[ancestors.length - 1];
        const data = new TestCase(name, thisGeneration);
        // 建立 TestItem 實例，
        // 這裡 ID 是檔案路徑/測試項目名稱，標籤是檔名，uri 為與此 TestItem 關聯的 uri。
        const id = `${item.uri}/${name}`;
        const tcase = controller.createTestItem(id, name, item.uri);
        //TestItem 介面很簡單，沒有空間容納自定義數據。 
        //如果需要將額外資訊與 TestItem 相關聯，可以使用 WeakMap
        //testData是WeakMap的set函數
        //WeakMap.prototype.set(key, value)：在 WeakMap 中設置一組key關聯物件，返回這個 WeakMap 物件。
        testData.set(tcase, data);
        //測試項目在在其 uri 中的位置。
        tcase.range = range;
        parent.children.push(tcase);
      },
    });

    //完成並為所有剩餘項目分配子項
    ascend(0);
  }
}

export class TestHeading {
  constructor(public generation: number) { }
}

export interface TestCaseResult {
  item: string,
  passed: boolean,
  message: TestMessage[]
}

export interface TestMessage {
  display: string,
  error: string
}

export class TestCase {
  constructor(
    private readonly name: string,
    public generation: number
  ) { }

  async run(item: vscode.TestItem, options: vscode.TestRun, testCaseResult: TestCaseResult, duration: number): Promise<void> {
    if (testCaseResult.passed) {
      options.passed(item, duration);
    } else {
      const markerdown = new vscode.MarkdownString();
      markerdown.appendMarkdown("<ul>");
      for (const messageContent of testCaseResult.message) {
        if (messageContent.display != "") {
          markerdown.appendMarkdown(
            `<li> 
              ${messageContent.display} <br/> 
              ${messageContent.error}
            </li>`
          );
        }
        else
        {
          markerdown.appendMarkdown(
            `<li>
              ${messageContent.error}
            </li>`
          );
        }
      }
      markerdown.appendMarkdown("</ul>");
      markerdown.supportHtml = true;
      const message = new vscode.TestMessage(markerdown);
      message.location = new vscode.Location(item.uri!, item.range!);
      options.failed(item, message, duration);
    }
  }
}