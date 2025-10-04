import * as cheerio from 'cheerio';
import { connectToDatabase } from './db';
import ExtensionModel from '@/models/ExtetsionModel';
import { TExtension } from '@/types/types';
import axios from 'axios';
import { saveExtensionIcon } from './saveExtensionIcon';

const paths = [
  'الحوت-الأزرق/philabpkooplanbpnnfapdcohlcmmnkj', // bluewhale
  'mnccalhaiokngcimjfngngjjggdhibpp', //bidpro
  'ehpiejnmbdjkaplmbafaejdhodalfbie', //auctiongate
  'fdljkckkhebjnbafdhanaakmmcjfkgjd', //mitridat
  'ieipllemffmocmcmjfnijlgfecalpcgn', // bexauto
  'caeecapkhmfakmcoppaimhpbfcgogjhj', // interalex
  'idkbonkeidlnjkbfjoammecfmdaibbmh', // caucasus,
  'mapbnmkenejciggnkildgcohibbnhnmm', //eridan
  'nbfdgjmapidikelppdieahmlddjinpjm', //logiline
  'nnfmkaglijgngnephnkgmaldmejandhk', //statvin
  'fojpkmgahmlajoheocnkebaoodepoekj', //autohelperbot
];

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function parseExtensions() {
  // DB connection
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

      // шукаємо "version"
      const versionMatch = content.match(/\\"version\\"\s*:\s*\\"([^\\"]+)\\"/);
      const version = versionMatch ? versionMatch[1] : null;

      // шукаємо "name"
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
            console.error('Не вдалося розпарсити масив:', e);
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

      if (!name || !version || !lastUpdate || !usersQty || !iconUrl) continue;

      await updateExtensionRecords({
        extensionId: id,
        name,
        version,
        lastUpdate,
        usersQty,
        iconUrl,
      });
    }
  } catch (error) {
    console.error(error);
  }
}

async function updateExtensionRecords({
  extensionId: id,
  name,
  version,
  lastUpdate,
  usersQty,
  iconUrl,
}: TExtension) {
  const extension = await ExtensionModel.findOne({ extensionId: id });

  if (extension) {
    // якщо версія змінилася
    if (extension.version !== version) {
      extension.history.push({
        version: version,
        usersQty,
        date: new Date(lastUpdate * 1000).toISOString(),
      });
      extension.version = version;
      extension.lastUpdate = lastUpdate;
      extension.usersQty = usersQty;
      extension.name = name; // оновлюємо ім'я на випадок зміни
      extension.iconUrl = iconUrl;
      await extension.save();
      await saveExtensionIcon(id, iconUrl);
      await sendMessageToTeegram({
        name,
        version,
        lastUpdate,
        usersQty,
        extensionId: id,
        iconUrl,
      });
    } else {
      extension.usersQty = usersQty;
      await extension.save();
    }
  } else {
    await ExtensionModel.create({
      extensionId: id,
      name,
      version,
      lastUpdate,
      usersQty,
      iconUrl,
      history: [
        { version, usersQty, date: new Date(lastUpdate * 1000).toISOString() },
      ],
    });
    await saveExtensionIcon(id, iconUrl);
    await sendMessageToTeegram({
      name,
      version,
      lastUpdate,
      usersQty,
      extensionId: id,
      iconUrl,
    });
  }
}

async function sendMessageToTeegram({
  name,
  version,
  lastUpdate,
  usersQty,
}: TExtension) {
  try {
    const message = `Назва: ${name}\nВерсія: ${version}\nДата останньої зміни: ${new Date(
      lastUpdate * 1000
    ).toLocaleString()}\nКількість користувачів: ${usersQty}`;
    console.log('TELEGRAM_BOT_TOKEN', TELEGRAM_BOT_TOKEN);
    await axios
      .post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: 915873774,
        text: message,
      })
      .then(response => {
        console.log('Message sent successfully:', response.data);
      })
      .catch(error => {
        console.error('Error sending message:', error);
      });
  } catch (error) {
    console.error(error);
  }
}
