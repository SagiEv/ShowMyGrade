function findSem(lines, i) {
  // Loop while i is greater than or equal to 0
  while (i >= 0) {
    // Check the current line for "sem a", "sem b", or "sem c"
    if (lines[i].includes("סמסטר א"))
      return "1:0:4";
    else if(lines[i].includes("סמסטר ב"))
      return "2:0:4";
    else if(lines[i].includes("סמסטר קיץ")) {
      return "3:0:4";
    }
    // Decrement i to move to the previous line
    i--;
  }
  // If none of the specified strings are found, return null or an appropriate value
  return null;
}

function base64Encode(str) {
  let base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64Str = '';

  for (let i = 0; i < str.length; i += 3) {
    let chunk = str.slice(i, i + 3);
    let chunkBytes = chunk.split('').map(c => c.charCodeAt(0));
    let encodedBytes = [];

    encodedBytes.push((chunkBytes[0] & 0xfc) >> 2);
    encodedBytes.push(((chunkBytes[0] & 0x03) << 4) | ((chunkBytes[1] & 0xf0) >> 4));
    encodedBytes.push(((chunkBytes[1] & 0x0f) << 2) | ((chunkBytes[2] & 0xc0) >> 6));
    encodedBytes.push(chunkBytes[2] & 0x3f);

    // Pad the encoded bytes with '=' as necessary
    if (chunk.length < 3) {
      encodedBytes[3] = 64;
      if (chunk.length == 1) {
        encodedBytes[2] = 64;
      }
    }

    base64Str += encodedBytes.map(b => base64Chars[b]).join('');
  }

  return base64Str;
}

let lines = document.documentElement.outerHTML.split('\n');
for (let i = 0; i < lines.length; i++) {
	if (lines[i].includes(' המחברת טרם נסרקה ') || lines[i].includes(' פרסום ')) {
    let course = '', sem = '', date = '',moed = '';
    
    if (lines[i].includes('<td dir="ltr"><span class="hebText"')) {
      reg0 = /(\d{4})/;  // matches four digits in a row
      year = lines[i].match(reg0);
      if(year) {date=year[1];}
    }
    if (i >= 2 && lines[i-2].includes('<span class="hebText">')) {
      let reg = /<span class="hebText">(\d+)<\/span>/;
      let coNum = lines[i-2].match(reg);
      if (coNum) {  course = coNum[1]; }
    }
    if (i >= 1 && (lines[i-1].includes('סמסטר') || lines[i-1].includes('חריגה'))) {
      let line = lines[i-1];
      reg1 = /סמסטר\s+(.)/; 
      sem = line.match(reg1);
      if ((sem && sem[1] == "א") || lines[i - 7].includes('סמסטר א') || lines[i + 5].includes('סמסטר א')) { sem = "1:0:1"; }
      else if ((sem && sem[1] == "ב") || lines[i - 7].includes('סמסטר ב') || lines[i + 5].includes('סמסטר ב')) { sem = "2:0:2"; }
      else if (line.includes("חריגה")) {
        sem = findSem(lines, i - 1)
      }
      let reg2 = /.*class="hebText">(.+)<\/span><\/td>$/;
      let Rmoed = line.match(reg2);
     if (Rmoed && Rmoed[1] =="א'") { moed="1:1"; }
     else if (Rmoed && Rmoed[1] =="ב'") { moed="2:2"; }
     else if (line.includes("בוחן 1")) { moed="1:11"; sem = sem.substring(0, 4) + "4";;}
     else { moed="3:3" }
    }
 

    let encode = date + ":" + sem + ":" + course + ":" + moed;
    encode="ex"+base64Encode(encode);
    lines[i]=lines[i].replace('<span class="hebText"> - המחברת טרם נסרקה -</span>','<input type="submit" name="'+encode+'=" value="קובץ המחברת" class="buttonSmallEntry">');
    lines[i]=lines[i].replace('<span class="hebText">המחברת נסרקה אבל תוצג אחרי פרסום ציון</span>','<input type="submit" name="'+encode+'=" value="קובץ המחברת" class="buttonSmallEntry">');
}
}

let htmlString = lines.join('\n');
document.documentElement.innerHTML = htmlString;

/*
  _________              .__  ___________                           .__ 
 /   _____/____     ____ |__| \_   _____/__  _________  ____   ____ |__|
 \_____  \\__  \   / ___\|  |  |    __)_\  \/ /\_  __ \/  _ \ /    \|  |
 /        \/ __ \_/ /_/  >  |  |        \\   /  |  | \(  <_> )   |  \  |
/_______  (____  /\___  /|__| /_______  / \_/   |__|   \____/|___|  /__|
        \/     \//_____/              \/                          \/    
_______________   ________  ________   __________  ________ ____ ___    
\_____  \   _  \  \_____  \ \_____  \  \______   \/  _____/|    |   \   
 /  ____/  /_\  \  /  ____/   _(__  <   |    |  _/   \  ___|    |   /   
/       \  \_/   \/       \  /       \  |    |   \    \_\  \    |  /    
\_______ \_____  /\_______ \/______  /  |______  /\______  /______/     
        \/     \/         \/       \/          \/        \/             
/*/
