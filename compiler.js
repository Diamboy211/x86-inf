import { instruction_table, reg_to_number } from "./constant.js"

export function assemble(tokens)
{
  let line, token;
  let reset = () => { line = 0; token = -1; };
  let get_next_token = () => {
    if (line >= tokens.length) return false;
    token++;
    if (token >= tokens[line].str.length)
    {
      line++;
      token = 0;
    }
    if (line >= tokens.length) return false;
    return {
      line,
      token,
      line_number: tokens[line].line,
      str: tokens[line].str[token]
    };
  };
  let get_current_token = () => {
    return {
      line,
      token,
      line_number: tokens[line].line,
      str: tokens[line].str[token]
    };
  };
  let done = () => line >= tokens.length;
  let get_mem_or_reg = () => {
    let a = get_next_token();
    if (a.str == "[")
    {
      let b = get_next_token();
      let c = get_next_token();
      if (c.str != "]")
      {
        errors.push(`line ${a.line_number}: unclosed \`[\``);
        return false;
      }
      let m = 'm'.concat(b.str);
      if (reg_to_number[m]) return { type: 1, reg: reg_to_number[m] };

      if (reg_to_number[b.str] === undefined)
        errors.push(`line ${b.line_number}: invalid register \`${b.str}\``);
      else errors.push(`line ${b.line_number}: invalid addressing mode \`[${b.str}]\``);
      return false;
      
    }
    else
    {
      if (reg_to_number[a.str] === undefined)
      {
        errors.push(`line ${a.line_number}: invalid register \`${a.str}\``);
        return false;
      }
      return { type: 0, reg: reg_to_number[a.str] };
    }
  };
  let errors = [];
  reset();
  // cache labels
  let labels = {};
  let a = get_next_token();
  let b = get_next_token();
  while (b)
  {
    if (b.str == ':')
    {
      if (labels[a.str]) errors.push(`line ${a.line_number}: label \`${a.str}\` defined in more than one place`);
      else labels[a.str] = { line: a.line, token: a.token };
    }
    a = b;
    b = get_next_token();
  }
  if (errors.length) return { errors };
  
  // verify instruction arguments and syntax
  reset();
  while (!done())
  {
    let c = get_next_token();
    if (!c) break;
    if (instruction_table[c.str])
    {
      switch (instruction_table[c.str].mode)
      {
      case 0: // 0 arguments
        break;
      case 1: // 1 argument: label
      {
        let d = get_next_token();
        if (!labels[d.str]) errors.push(`line ${a.line_number}: undeclared label \`${d.str}\``);
        break;
      }
      case 2: // 1 argument: reg/mem
      {
        get_mem_or_reg();
        break;
      }
      case 3:
      {
        let a1 = get_mem_or_reg();
        if (!a1) break;
        let s = get_next_token();
        if (s.str != ',')
        {
          errors.push(`line ${c.line_number}: invalid seperator \`${s.str}\``);
          break;
        }
        let a2 = get_mem_or_reg();
        if (!a2) break;
        if (a1.type && a2.type)
        {
          errors.push(`line ${c.line_number}: invalid addressing mode \`${c.str} mem, mem\``);
          break;
        }
        break;
      }
      case 4:
      {
        let next = get_next_token();
        if (instruction_table[next.str])
        {
          if (instruction_table[next.str].mode == 5)
            c = next;
          else
          {
            errors.push(`line ${next.line_number}: \`${next.str}\` is not a non-comparing string instruction`);
            break;
          }
        }
        else
        {
          errors.push(`line ${next.line_number}: \`${next.str}\` is not a valid instruction`);
          break;
        }
        // fallthrough
      }
      case 5:
        break;
      case 6:
      {
        let next = get_next_token();
        if (instruction_table[next.str])
        {
          if (instruction_table[next.str].mode == 7)
            c = next;
          else
          {
            errors.push(`line ${next.line_number}: \`${next.str}\` is not a comparing string instruction`);
            break;
          }
        }
        else
        {
          errors.push(`line ${next.line_number}: \`${next.str}\` is not a valid instruction`);
          break;
        }
        // fallthrough
      }
      case 7:
        break;
      default:
        console.log("bitch you drunk");
        break;
      }
    }
    else
    {
      let d = get_next_token();
      if (d.str == ':') continue;
      errors.push(`line ${c.line_number}: unexpected identifier \`${c.str}\``);
    }
  }
  if (errors.length) return { errors };

  let code = [];
  reset();
  while (!done())
  {
    let c = get_next_token();
    if (!c) break;
    if (instruction_table[c.str])
    {
      switch (instruction_table[c.str].mode)
      {
      case 0: // 0 arguments
      {
        code.push(instruction_table[c.str].op);
        break;
      }
      case 1: // 1 argument: label
      {
        let d = get_next_token();
        code.push(instruction_table[c.str].op);
        for (let i = 0; i < d.str.length; i++)
          code.push(d.str.charCodeAt(i));
        code.push(0);
        break;
      }
      case 2: // 1 argument: reg/mem
      {
        let d = get_mem_or_reg();
        code.push(instruction_table[c.str].op);
        code.push(d.reg);
        break;
      }
      case 3:
      {
        let a1 = get_mem_or_reg();
        let s = get_next_token();
        let a2 = get_mem_or_reg();
        code.push(instruction_table[c.str].op);
        code.push(a1.reg);
        code.push(a2.reg);
        break;
      }
      default:
        break;
      }
    }
    else
    {
      let d = get_next_token();
      code.push(instruction_table["$label"].op);
      for (let i = 0; i < c.str.length; i++)
        code.push(c.str.charCodeAt(i));
      code.push(0);
    }
  }
  return { code: new Uint8Array(code) };
}