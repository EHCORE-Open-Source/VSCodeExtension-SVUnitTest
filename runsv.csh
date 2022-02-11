#!/bin/csh
# Setup Synopsys License Server
setenv SNPSLMD_LICENSE_FILE 12345@licenseserver
# Setup SVUNIT INSTALL PATH
setenv SVUNIT_INSTALL /PATH_to/SVUNIT/svunit-3.34.2
# Setup Synopsys VCS HOME PATH
setenv VCS_HOME /PATH_to/SVUNIT/M-2017.03-SP1
# Update PATH
setenv PATH ${PATH}:${VCS_HOME}/bin:${SVUNIT_INSTALL}/bin
# Change Directory to *_unit_test.sv and *.v PATH
cd /PATH_to/VSCodeExtension-SVUnit/sample
# Run SVUnit Command
runSVUnit -s vcs -c -full64