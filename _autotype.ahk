; README
; expected dir struct
; folder/
; ├── _autotype.ahk
; └── src/
;     ├── file1.txt
;     ├── file2.txt
;     └── ...
; INSTRUCTIONS:
;
; 1. Place every file you need inside the "src" folder.
; 2. Run "_autotype.ahk" to start your typing automation script.
; 
; IMPORTANT:
; 
; - Make sure to DISABLE ALL AUTO-COMPLETE features in your code editor, including:
;   - HTML tag auto-complete
;   - Braces and parentheses auto-complete
;   - String quotes auto-complete
;   - Any other form of automatic insertion
; 
; This prevents your editor from interfering with automated typing.
;
; in vscode:
; ctrl+shift+p
; enter: settings workspace json
; and copy the text inside settings.json
; 
; END OF README


; === CONFIGURATION ===
#MaxHotkeysPerInterval 2000
fileBasePath := ".\src\" ; Base path to your text files

; === GLOBAL VARIABLES ===
currentIndex := 1
fileContents := ""
isActive := false
isNewLine := true

; === LOAD FILE FUNCTION ===
LoadFile(fileName)
{
    global fileBasePath, fileContents, currentIndex
    filePath := fileBasePath . fileName

    if FileExist(filePath)
    {
        FileRead, fileContents, %filePath%
        currentIndex := 1
        TrayTip, AHK Script, Loaded %filePath%, 1
    }
    else
    {
        TrayTip, AHK Script, File not found: %filePath%, 1
    }
}

; === TOGGLE SCRIPT (F5) ===
F5::
    isActive := !isActive
    if (isActive) {
        TrayTip, AHK Script, Typing automation ENABLED, 1
    } else {
        TrayTip, AHK Script, Typing automation DISABLED, 1
    }
return

; === LOAD FILE BASED ON ACTIVE WINDOW (F6) ===
F6::
    WinGetTitle, activeTitle, A
    ; SplitPath, activeTitle,,, ext, name

    StringSplit, parts, activeTitle, %A_Space%- ; split by " - "
    RegExMatch(activeTitle, "^(?:[^\w\d]*\s*)?([^\s].*?)\s+-", match)

    fileName := match1

	; Optional: remove extension if you want only file base name
    ; SplitPath, fileName, nameNoExt
    ; fileName := nameNoExt
	
    ; Load corresponding .txt file
    LoadFile(fileName)
return

; === DEFINE HOTKEYS FOR A-Z MANUALLY ===
; AutoHotkey v1 limitation: define hotkeys explicitly.

; a-z hotkeys
$a::TypeChar("a")
$b::TypeChar("b")
$c::TypeChar("c")
$d::TypeChar("d")
$e::TypeChar("e")
$f::TypeChar("f")
$g::TypeChar("g")
$h::TypeChar("h")
$i::TypeChar("i")
$j::TypeChar("j")
$k::TypeChar("k")
$l::TypeChar("l")
$m::TypeChar("m")
$n::TypeChar("n")
$o::TypeChar("o")
$p::TypeChar("p")
$q::TypeChar("q")
$r::TypeChar("r")
$s::TypeChar("s")
$t::TypeChar("t")
$u::TypeChar("u")
$v::TypeChar("v")
$w::TypeChar("w")
$x::TypeChar("x")
$y::TypeChar("y")
$z::TypeChar("z")

; 0-9 hotkeys
$0::TypeChar("0")
$1::TypeChar("1")
$2::TypeChar("2")
$3::TypeChar("3")
$4::TypeChar("4")
$5::TypeChar("5")
$6::TypeChar("6")
$7::TypeChar("7")
$8::TypeChar("8")
$9::TypeChar("9")

; Special character hotkeys (standard US layout)
$`::TypeChar("`")
$-::TypeChar("-")
$=::TypeChar("=")
$[::TypeChar("[")
$]::TypeChar("]")
$\::TypeChar("\")
$;::TypeChar(";")
$'::TypeChar("'")
$,::TypeChar(",")
$.::TypeChar(".")
$/::TypeChar("/")
$~::TypeChar("~")

; Enter
$Space::TypeChar(" ")
$Enter::TypeChar("`n")
$Return::TypeChar("`n")

; === FUNCTION TO TYPE NEXT CHARACTER OR FALLBACK ===
TypeChar(key)
{
    global isActive, currentIndex, fileContents, isNewLine
    if (isActive) {
        Loop
        {
            if (currentIndex > StrLen(fileContents)) {
                TrayTip, AHK Script, End of file reached., 1
                Return
            }
            char := SubStr(fileContents, currentIndex, 1)
            currentIndex++

            ; Skip carriage returns
            if (char = "`r")
                continue

            ; Skip leading spaces and tabs at start of line
            if (isNewLine and (char = " " or char = "`t"))
                continue

            ; Send character
            SendRaw, %char%

            ; If newline
            if (char = "`n")
            {
                isNewLine := true
                Sleep, 1000
                Send, ^s
            }
            else
            {
                isNewLine := false
            }

            break
        }
    } else {
        Send, %key%
    }
}
