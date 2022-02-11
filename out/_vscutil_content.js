"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execShellCommand = void 0;
const child_process_1 = require("child_process");
const execShellCommand = async function () {
    return new Promise((resolve, reject) => {
        child_process_1.exec("type D:\\Work2\\VSCodeExtension\\VSCodeExtension-SVUnit\\sample\\SVUnit_adder_all.txt", (error, stdout, stderr) => {
            const fileContent = stdout;
            const patterninfo = /(INFO):\s*\[\d+\]\[.*?\]:\s(.*)::RUNNING/;
            const patternerror = /(ERROR):\s*\[\d+\]\[.*?\]:\s(.*)/;
            const resultList = [];
            //將內容以換行符號\n轉換為陣列
            const lines = fileContent.split('\n');
            for (let lineStartNo = 0; lineStartNo < lines.length; lineStartNo++) {
                //取行的內容
                const line = lines[lineStartNo];
                //找到符合的字串
                const testinfo = patterninfo.exec(line);
                if (testinfo) {
                    const nextline = lineStartNo + 1;
                    const testerror = patternerror.exec(lines[nextline]);
                    if (testerror) {
                        resultList.push({ item: testinfo[2], passed: false, message: [] }); //testerror[2] });
                    }
                    else {
                        resultList.push({ item: testinfo[2], passed: true, message: [] });
                    }
                }
            }
            resolve(resultList);
        });
    });
};
exports.execShellCommand = execShellCommand;
//# sourceMappingURL=_vscutil_content.js.map