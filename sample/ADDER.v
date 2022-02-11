module ADDER (A, B ,C);

    input [3:0] A, B;
    output [4:0] C;
    
    assign C = A+B;

endmodule