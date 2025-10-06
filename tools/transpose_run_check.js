const fs = require('fs');
const { execSync } = require('child_process');

const input = `Chorus
 |G         |Em7         |C              |D
 我要  敬  拜你  主        你恢  復我  生 命   獻上我心
 |Bm7       |Em7         |Am7            |D          (|G)
    成為你的  聖所         唯有你耶穌     能得著  我(的)心

inst
 |G     |Em7   |C         |D      |
 |Bm7   |E     |Am7  A/C# |C   D  |

Bridge
 |C           |G/B         |C            |Em7 D
  你  是信實真神      榮耀君王         我一生尊崇你 我的主
 |Am7         |G/B         |F            |D      |D`;

fs.writeFileSync('d:/sonhomework/tools/input_chords.txt', input, 'utf8');
execSync('node d:/sonhomework/tools/transpose_check.js', { stdio: 'inherit' });
