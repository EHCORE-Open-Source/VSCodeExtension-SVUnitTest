"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execShellCommand = void 0;
const child_process_1 = require("child_process");
const patterninfo = /(INFO):\s*\[\d+\]\[.*?\]:\s(.*)::RUNNING/;
const execShellCommand = async function () {
    return new Promise((resolve, reject) => {
        child_process_1.exec('/PATH_to/VSCodeExtension-SVUnit/runsv.csh', (error, stdout, stderr) => {
            const fileContent = stdout;
            const resultList = [];
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
exports.execShellCommand = execShellCommand;
function getDisplay(lines, lineStartNo) {
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
function getTestMessage(lines, lineStartNo, testItem) {
    const testItemRunning = new RegExp(`(INFO):\\s*\\[\\d+\\]\\[.*?\\]:\\s*${testItem}::RUNNING`);
    const testItemPassed = new RegExp(`(INFO):\\s*\\[\\d+\\]\\[.*?\\]:\\s*${testItem}::PASSED`);
    const testItemFailed = new RegExp(`(INFO):\\s*\\[\\d+\\]\\[.*?\\]:\\s*${testItem}::FAILED`);
    const patternerror = /(ERROR):\s*\[\d+\]\[.*?\]:\s(.*)/;
    let runningCount = 0;
    let passedCount = 0;
    let lineLastNo = 0;
    const messageList = [];
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
//# sourceMappingURL=vscutil_content.js.map