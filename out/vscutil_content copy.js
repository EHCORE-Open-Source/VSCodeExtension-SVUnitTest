"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execShellCommand = void 0;
const execShellCommand = async function () {
    return new Promise((resolve, reject) => {
        const result = [
            { item: 'ADDER_3_plus_5_out_8', passed: true, message: [] },
            {
                item: 'ADDER_3_plus_5_out_9',
                passed: false,
                message: [
                    {
                        display: "",
                        error: "fail_if: C !== 5'd8 (at /home/frentester/UnitTest/svunit-3.34.2/adder/./ADDER_unit_test.sv line:67"
                    }
                ]
            },
            {
                item: 'SERIAL2PARALLEL_all_random',
                passed: false,
                message: [
                    {
                        display: "regPREAMBLE= 4, regADDRESS= 159, regPSI=4, regCOMMAND= 50, regCRC=228 PREAMBLE= 0,    ADDRESS=  16,    PSI=4,    COMMAND=126,    CRC=228",
                        error: "fail_if: DATA_OUT != DATA_VERIFIED (at /home/frentester/UnitTest/svunit-3.34.2/Dominant/S2P/./SERIAL2PARALLEL_unit_test.sv line:164)"
                    },
                    {
                        display: "regPREAMBLE= 5, regADDRESS= 947, regPSI=4, regCOMMAND= 99, regCRC= 22  PREAMBLE= 0,    ADDRESS=  23,    PSI=5,    COMMAND= 78,    CRC=  0",
                        error: "fail_if: DATA_OUT != DATA_VERIFIED (at /home/frentester/UnitTest/svunit-3.34.2/Dominant/S2P/./SERIAL2PARALLEL_unit_test.sv line:164)"
                    }
                ]
            },
        ];
        resolve(result);
    });
};
exports.execShellCommand = execShellCommand;
//# sourceMappingURL=vscutil_content%20copy.js.map