import * as cheerio from 'cheerio';

const paths = [
  'الحوت-الأزرق/philabpkooplanbpnnfapdcohlcmmnkj', // bluewhale
  'mnccalhaiokngcimjfngngjjggdhibpp', //bidpro
  'ehpiejnmbdjkaplmbafaejdhodalfbie', //auctiongate
  'fdljkckkhebjnbafdhanaakmmcjfkgjd', //mitridat
  'ieipllemffmocmcmjfnijlgfecalpcgn', // bexauto
  'caeecapkhmfakmcoppaimhpbfcgogjhj', // interalex
];

export async function parseExtensions() {
  try {
    for (const path of paths) {
      const htmlText = await fetch(
        `https://chromewebstore.google.com/detail/${path}`
      ).then(res => res.text());

      const $ = cheerio.load(htmlText);

      const scripts = $('script')
        .map((_, el) => $(el).html())
        .get();

      const id = path.split('/').pop()!;

      const dataScript = scripts.find(
        text => text?.startsWith('AF_initDataCallback') && text.includes(id)
      );

      if (!dataScript) continue;
      const match = dataScript.match(/AF_initDataCallback\((\{.*\})\);?$/s);
      if (!match) continue;

      const content = match[1];

      // шукаємо "version"
      const versionMatch = content.match(/\\"version\\"\s*:\s*\\"([^\\"]+)\\"/);
      const version = versionMatch ? versionMatch[1] : null;

      // шукаємо "name"
      const nameMatch = content.match(/\\"name\\"\s*:\s*\\"([^\\"]+)\\"/);
      const name = nameMatch ? nameMatch[1] : null;

      // шукаємо таймстамп, який йде після версії
      let timestamp: number[] | null = null;
      if (version) {
        const regex = new RegExp(`"${version}"\\s*,\\s*(\\[[^\\]]+\\])`);
        const matchTime = dataScript.match(regex);
        if (matchTime) {
          try {
            timestamp = JSON.parse(matchTime[1])?.[0];
          } catch (e) {
            console.error('Не вдалося розпарсити масив:', e);
          }
        }
      }

      const usersRegex = /\["[^"]+\/[^"]+",null,\d+\],1,null,(\d+),/;
      const usersMatch = dataScript.match(usersRegex);

      let users: number | null = null;
      if (usersMatch) {
        users = parseInt(usersMatch[1], 10);
      }

      console.log({ name, version, timestamp, users });
    }
  } catch (error) {
    console.error(error);
  }
}
