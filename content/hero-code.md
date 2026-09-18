```lightml
open System

type Expr =
  | Num of int
  | Var of string
  | Add of Expr * Expr
  | Mul of Expr * Expr
  | Let of string * Expr * Expr

let rec eval env expr =
  match expr with
  | Num n -> n
  | Var x -> env x
  | Add (l, r) -> eval env l + eval env r
  | Mul (l, r) -> eval env l * eval env r
  | Let (name, value, body) ->
      let n = eval env value
      eval (fun y -> if y = name then n else env y) body

let program =
  Let ("x", Num 3,
    Let ("y", Add (Var "x", Num 4),
      Mul (Var "y", Add (Var "x", Num 1))))

let mutable result = eval (fun _ -> 0) program
print result
```
