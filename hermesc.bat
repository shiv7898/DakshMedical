@echo off
set "outfile=%~3"
set "infile=%~4"
if "%~1"=="-emit-binary" (
    copy /Y "%infile%" "%outfile%"
    exit /b 0
)
exit /b 1
