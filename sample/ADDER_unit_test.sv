`include "svunit_defines.svh"
`include "ADDER.v"

module ADDER_unit_test;
  import svunit_pkg::svunit_testcase;

  string name = "ADDER_ut";
  svunit_testcase svunit_ut;

  //===================================
  // This is the UUT that we're 
  // running the Unit Tests on
  //===================================
  reg [3:0] A;
  reg [3:0] B;
  wire [4:0] C;
  ADDER uadder (.*);

  //===================================
  // Build
  //===================================
  function void build();
    svunit_ut = new(name);
  endfunction

  //===================================
  // Setup for running the Unit Tests
  //===================================
  task setup();
    svunit_ut.setup();
  endtask

  //===================================
  // Here we deconstruct anything we 
  // need after running the Unit Tests
  //===================================
  task teardown();
    svunit_ut.teardown();
    /* Place Teardown Code Here */
  endtask

  //===================================
  // All tests are defined between the
  // SVUNIT_TESTS_BEGIN/END macros
  //
  // Each individual test must be
  // defined between `SVTEST(_NAME_)
  // `SVTEST_END
  //
  // i.e.
  //   `SVTEST(mytest)
  //     <test code>
  //   `SVTEST_END
  //===================================
  `SVUNIT_TESTS_BEGIN

  //************************************************************
  // Test:
  //   adder_3_plus_5
  //
  // Desc:
  //   do 3+5
  //************************************************************
   
  `SVTEST(ADDER_3_plus_5_out_8)
    A=4'd3;
    B=4'd5;
    `FAIL_IF(C != 5'd8);
  `SVTEST_END 

  //************************************************************
  // Test:
  //   adder_3_plus_5
  //
  // Desc:
  //   do 3+5
  //************************************************************
   
  `SVTEST(ADDER_3_plus_5_out_9)
    A=4'd3;
    B=4'd5;
    `FAIL_IF(C != 5'd9);
  `SVTEST_END 

  `SVUNIT_TESTS_END
endmodule