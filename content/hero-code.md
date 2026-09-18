```lightml
open System

let source = "let n = 42 + x"
let mutable i = 0
let mutable kind = ""
let mutable text = ""

skipSpace of void() {} =
    while { i < source.Length } =
        if { source[i] = ' ' } =
            | then do
                mut i <- i + 1
            | else do
                mut text <- text

readNumber of void() {} =
    mut kind <- "Number"
    mut text <- ""
    while { i < source.Length } =
        if { source[i] >= '0' } =
            | then do
                mut i <- i + 1
            | else do
                mut kind <- "Number"

readIdent of void() {} =
    mut kind <- "Ident"
    mut text <- ""
    while { i < source.Length } =
        if { source[i] >= 'a' } =
            | then do
                mut i <- i + 1
            | else do
                mut kind <- "Ident"

readSymbol of void() {} =
    mut kind <- "Symbol"
    mut text <- ""
    mut i <- i + 1

lex of void() {} =
    skipSpace
    if { i < source.Length } =
        | then do
            match { source[i] } =
                | '=' do
                    readSymbol
                | '+' do
                    readSymbol
                | '0' do
                    readNumber
                | 'l' do
                    readIdent
        | else do
            mut kind <- "End"
            mut text <- ""
    print kind
    print text

lex
```
