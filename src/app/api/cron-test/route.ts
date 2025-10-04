import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';

const paths = [
  'Ш§Щ„Ш­Щ€ШЄ-Ш§Щ„ШЈШІШ±Щ‚/philabpkooplanbpnnfapdcohlcmmnkj', // bluewhale
  'mnccalhaiokngcimjfngngjjggdhibpp', //bidpro
  'ehpiejnmbdjkaplmbafaejdhodalfbie', //auctiongate
  'fdljkckkhebjnbafdhanaakmmcjfkgjd', //mitridat
  'ieipllemffmocmcmjfnijlgfecalpcgn', // bexauto
  'caeecapkhmfakmcoppaimhpbfcgogjhj', // interalex
  'idkbonkeidlnjkbfjoammecfmdaibbmh', // caucasus,
  'mapbnmkenejciggnkildgcohibbnhnmm', //eridan
  'nbfdgjmapidikelppdieahmlddjinpjm', //logiline
  'nnfmkaglijgngnephnkgmaldmejandhk', //statvin
  'autohelperbot/fojpkmgahmlajoheocnkebaoodepoekj', //autohelperbot
];

export const POST = async () => {
  console.log('Cron job triggered');
  await connectToDatabase();
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

      // С€СѓРєР°С”РјРѕ "version"
      const versionMatch = content.match(/\\"version\\"\s*:\s*\\"([^\\"]+)\\"/);
      const version = versionMatch ? versionMatch[1] : null;

      // С€СѓРєР°С”РјРѕ "name"
      const titleText = $('title').text().trim();
      const name = titleText
        ? titleText.split('-').slice(0, -1).join('-').trim()
        : null;

      let lastUpdate: number | null = null;
      if (version) {
        const regex = new RegExp(`"${version}"\\s*,\\s*(\\[[^\\]]+\\])`);
        const matchTime = dataScript.match(regex);
        if (matchTime) {
          try {
            lastUpdate = JSON.parse(matchTime[1])?.[0];
          } catch (e) {
            console.error('РќРµ РІРґР°Р»РѕСЃСЏ СЂРѕР·РїР°СЂСЃРёС‚Рё РјР°СЃРёРІ:', e);
          }
        }
      }

      const usersRegex = /\["[^"]+\/[^"]+",null,\d+\],(1|null),(1|null),(\d+),/;
      const usersMatch = dataScript.match(usersRegex);

      let usersQty: number | null = null;
      if (usersMatch) {
        usersQty = parseInt(usersMatch[3], 10);
      }

      const iconMatch = content.match(
        /https:\/\/lh3\.googleusercontent\.com\/[^\s",]+/
      );
      const iconUrl = iconMatch ? iconMatch[0] : null;

      console.log('name', name);

      if (!name || !version || !lastUpdate || !usersQty || !iconUrl) continue;
    }
  } catch (error) {
    console.error(error);
  }
  return NextResponse.json({ success: true }, { status: 200 });
};



