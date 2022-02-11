"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMarkdown = void 0;
const vscode = require("vscode");
const testStartRe = /^\s*`SVTEST\((.+)\)\s$/;
const testEndRe = /^\s*`SVTEST_END\s*$/;
const testLoopStartRe = /^\s*for.+/;
//const testLoopEndRe = /^\s*end\s*$/;
const testAnnotationRe = /^\s*\/\/\s*Test:\s*$/;
const testAnnotationContentRe = /(?<=^\s*\/\/\s*)[^\s].+/;
const parseMarkdown = (text, events) => {
    //將內容以換行符號\n轉換為陣列
    const lines = text.split('\n');
    for (let lineStartNo = 0; lineStartNo < lines.length; lineStartNo++) {
        //取行的內容
        let line = lines[lineStartNo];
        //找到符合`SVTEST()的字串
        const test = testStartRe.exec(line);
        let isHaveLoop = false;
        //有找到時
        if (test) {
            const lineLoopStartNo = lineStartNo - 2;
            const testLoop = testLoopStartRe.exec(lines[lineLoopStartNo]);
            //name變數是`SVTEST()其()中的字串
            const [, name] = test;
            //取得符合結尾的字串的行號
            let lineEndNo = getLineEndNo(lines, lineStartNo);
            if (testLoop) {
                line = lines[lineLoopStartNo];
                lineEndNo += 1;
                isHaveLoop = true;
            }
            //測試項目在uri的範圍，從該行數第一個字，到該行數全部的字。
            //錯誤時會框列整個範圍           
            const range = new vscode.Range(new vscode.Position(isHaveLoop ? lineLoopStartNo : lineStartNo, 0), new vscode.Position(lineEndNo, lines[lineEndNo].length));
            //執行onTest事件
            events.onTest(range, name);
            //把lineStartNo設定為結束的行號，讓下一次從結束的行號+1開始執行
            lineStartNo = lineEndNo;
        }
    }
};
exports.parseMarkdown = parseMarkdown;
//找結尾的字串
function getLineEndNo(lines, lineStartNo) {
    //結尾的行號從起始行號的下一行開始
    let lineEndNo = lineStartNo + 1;
    for (; lineEndNo < lines.length; lineEndNo++) {
        //取行的內容
        const line = lines[lineEndNo];
        //找到符合`SVTEST_END的字串
        const test = testEndRe.exec(line);
        //有找到時
        if (test) {
            //跳出迴圈     
            break;
        }
    }
    return lineEndNo;
}
//# sourceMappingURL=parser.js.map