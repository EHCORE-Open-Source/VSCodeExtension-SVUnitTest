import { TestCaseResult, TestMessage } from './testTree';
import { exec } from 'child_process';

export interface lineLastNoAndTestMessage {
    lineLastNo: number,
    passed: boolean,
    message: TestMessage[]
}

const patterninfo = /(INFO):\s*\[\d+\]\[.*?\]:\s(.*)::RUNNING/;

export const execShellCommand = async function (): Promise<any> {
    return new Promise((resolve, reject) => {
        exec('/PATH_to/VSCodeExtension-SVUnit/runsv.csh', (error: any, stdout: string, stderr: string) => {
            const fileContent = stdout;
            const resultList: TestCaseResult[] = [];

            //將內容以換行符號\n轉換為陣列
            const lines = fileContent.split('\n');
            for (let lineStartNo = 0; lineStartNo < lines.length; lineStartNo++) {
                //取行的內容
                const line = lines[lineStartNo];
                //找到符合的字串
                const testinfo = patterninfo.exec(line);
                if (testinfo) {
                    const testMessage = getTestMessage(lines, lineStartNo, testinfo[2]);
                    lineStartNo = testMessage.lineLastNo;
                    resultList.push({ item: testinfo[2], passed: testMessage.passed, message: testMessage.message });
                }
            }
            resolve(resultList);
        });
    });
};

function getDisplay(lines: string[], lineStartNo: number): string {
    let lineNo = lineStartNo;
    let result = "";
    for (; lineNo > 0; lineNo--) {
        //取行的內容
        const line = lines[lineNo];
        const testinfo = patterninfo.exec(line);
        if (testinfo) {
            break;
        }
        else {
            result += line;
        }
    }
    return result;
}

function getTestMessage(lines: string[], lineStartNo: number, testItem: string): lineLastNoAndTestMessage {
    const testItemRunning = new RegExp(`(INFO):\\s*\\[\\d+\\]\\[.*?\\]:\\s*${testItem}::RUNNING`);
    const testItemPassed = new RegExp(`(INFO):\\s*\\[\\d+\\]\\[.*?\\]:\\s*${testItem}::PASSED`);
    const testItemFailed = new RegExp(`(INFO):\\s*\\[\\d+\\]\\[.*?\\]:\\s*${testItem}::FAILED`);
    const patternerror = /(ERROR):\s*\[\d+\]\[.*?\]:\s(.*)/;
    let runningCount = 0;
    let passedCount = 0;
    let lineLastNo = 0;
    const messageList: TestMessage[] = [];
    //行號從起始行號的下一行開始
    let lineNo = lineStartNo;
    for (; lineNo < lines.length; lineNo++) {
        //取行的內容
        const line = lines[lineNo];
        //找到相同的 Running 
        if (testItemRunning.exec(line)) {
            runningCount += 1;
            lineLastNo = lineNo;
        }
        //找到相同的 Running 
        passedCount += testItemPassed.exec(line) ? 1 : 0;
    }

    // 有發生錯誤
    if (runningCount != passedCount) {
        let lineNo = lineStartNo;
        for (; lineNo < lines.length; lineNo++) {
            //取行的內容
            const line = lines[lineNo];
            //找 failed
            if (testItemFailed.exec(line)) {
                let beforLine = lineNo - 1;
                const testerror = patternerror.exec(lines[beforLine]);
                //const error = testerror[2];
                if (testerror) {
                    const error = testerror[2];
                    beforLine = beforLine - 1;
                    const display = getDisplay(lines, beforLine);
                    messageList.push({ display: display, error: error });
                }
            }
        }
    }

    return { lineLastNo: lineLastNo, passed: runningCount == passedCount, message: messageList };
}