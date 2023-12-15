import { nyaaUrl } from '#/constants';
import {
  INyaaData,
  IProvider,
  ITorrentRelease,
  ISneedexRelease
} from '#interfaces/index';
import { app } from '#/index';
import { Utils } from '#utils/Utils';
import { load } from 'cheerio';

export class Nyaa implements IProvider {
  readonly name: string;
  constructor() {
    this.name = 'Nyaa';
  }

  private async fetch(query: string): Promise<INyaaData> {
    Utils.debugLog(this.name, 'cache', `${this.name}_${query}`);
    const cachedData = await app.cache.get(`${this.name}_${query}`);
    if (cachedData) {
      Utils.debugLog(this.name, 'cache', `Cache hit: ${this.name}_${query}`);
      return cachedData as INyaaData;
    }
    Utils.debugLog(this.name, 'cache', `Cache miss: ${this.name}_${query}`);

    const scrapeUrl = `https://nyaa.si/view/${query}`;
    Utils.debugLog(this.name, 'fetch', query);
    Utils.debugLog(this.name, 'fetch', `Fetching data from ${scrapeUrl}`);

    const html = await fetch(scrapeUrl).then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.text();
    });

    const $ = load(html);

    const scrapedData = {
      title: $('body > div > div:nth-child(1) > div.panel-heading > h3')
        .text()
        .trim(),
      date: $('div.row:nth-child(1) > div:nth-child(4)').text().trim(),
      seeders: +$(
        'div.row:nth-child(2) > div:nth-child(4) > span:nth-child(1)'
      )
        .text()
        .trim(),
      leechers: +$(
        'div.row:nth-child(3) > div:nth-child(4) > span:nth-child(1)'
      )
        .text()
        .trim(),
      size: $('div.row:nth-child(4) > div:nth-child(2)').text().trim(),
      completed: +$('div.row:nth-child(4) > div:nth-child(4)').text().trim(),
      infohash: $(
        'div.row:nth-child(5) > div:nth-child(2) > kbd:nth-child(1)'
      )
        .text()
        .trim(),
      files: $(
        '.torrent-file-list > ul:nth-child(1) > li:nth-child(1) > ul:nth-child(2)'
      ).find('li').length,
      id: +query
    };

    Utils.debugLog(
      this.name,
      'fetch',
      `Fetched data, caching ${this.name}_${query}`
    );
    await app.cache.set(`${this.name}_${query}`, scrapedData);

    return scrapedData as INyaaData;
  }

  private formatTitle(originalTitle: string): string {
    const releaseGroupRegex = /^\[([^\]]+)]/;
    const releaseGroupMatch = originalTitle.match(releaseGroupRegex);
    const releaseGroup = releaseGroupMatch ? releaseGroupMatch[1] : '';

    const showNameRegex = /\]\s*([^[(\]\[]+[^)\]\[])\s*(?:(?<!Season|[Ss]\d+|Arc)\(|\[|\])/;
    const filteredWords = ['ova', 'ovas', 'special', 'specials', 'series', 'complete', 'collection'];
    const filteredChars = ['+'];

    const filteredShowName = originalTitle.match(showNameRegex)?.[1].replace(
      new RegExp(`\\b(?:${filteredWords.join('|')})\\b`, 'gi'),
      ''
    ).replace(
      new RegExp(`[${filteredChars.join('')}]`, 'g'),
      ''
    );
      // Remove aliases from the filtered show name
      const aliases = [
        'Kaitei 3-man Mile',
        'Byousoku 5 Centimeter',
        'Toaru Majutsu no Index',
        'Toaru Kagaku no Accelerator',
        'Toaru Kagaku no Railgun',
        'Itsuka Tenma no Kuro Usagi',
        'Momo e no Tegami',
        'Nagi no Asukara',
        'Sora yori mo Tooi Basho',
        'Koe no Katachi',
        'Imouto sae Ireba Ii.',
        'Kimi no Iru Machi',
        'Nakitai Watashi wa Neko o Kaburu',
        'ACCA: 13-ku Kansatsu-ka',
        'Gyakuten Saiban: Sono "Shinjitsu", Igi Ari!',
        'Adachi to Shimamura',
        'Hagure Yuusha no Aesthetica',
        'Koi wa Ameagari no You ni',
        'Rokudenashi Majutsu Koushi',
        'Akebi-chan no Sailor Fuku',
        'Nejimaki Seirei Senki: Tenkyou no Alderamin',
        'Soredemo Machi wa Mawatte Iru',
        'Netoge no Yome wa Onnanoko',
        'ja Nai to Omotta?',
        'Tenshi no 3P!',
        'Tenshi no Tamago',
        'Angolmois: Genkou Kassenki',
        'Anime De Training!',
        'Ano Hi Mita Hana no Namae wo Bokutachi wa',
        'Mada Shiranai.',
        'Taimadou Gakuen 35 Shiken Shoutai',
        'Midara na Ao-chan wa Benkyou ga Dekinai',
        'Ao no Kanata no Four Rhythm',
        'Waga Seishun no Arcadia',
        'Sounan desu ka?',
        'Hidan no Aria',
        'Arifureta Shokugyou de Sekai Saikyou',
        'Otona no Bouguya-san',
        'Honzuki no Gekokujou: Shisho ni Naru Tame',
        'ni wa Shudan wo Erandeiraremasen',
        'Asobi Asobase',
        'Ansatsu Kyoushitsu',
        'Koisuru Asteroid',
        'Kanata no Astra',
        'Sora no Manimani',
        'Escha & Logy no Atelier:',
        'Tasogare no Sora no Renkinjutsushi',
        'Shingeki no Kyojin',
        'Aura: Maryuuin Kouga Saigo no Tatakai',
        'Itai no wa Iya nano de Bougyoryoku ni',
        'Kyokufuri Shitai to Omoimasu.',
        'Boruto: Naruto the Movie',
        'Daishizen no Majuu: Bagi',
        'BAYONETTA Bloody Fate',
        'Sakurako-san no Ashimoto ni wa',
        'Shitai ga Umatteiru',
        'Kenpuu Denki Berserk',
        'Kyoukai no Kanata',
        'Da Yu Hai Tang',
        'Ookiku Furikabutte',
        'Kuroshitsuji',
        'Seirei Tsukai no Blade Dance',
        'Zetsuen no Tempest',
        'Kekkai Sensen',
        'Yagate Kimi ni Naru',
        'Ao no Exorcist',
        'Akai Kiba: Blue Sonnet',
        'Ao Haru Ride',
        'Kishuku Gakkou no Juliet',
        'Yofukashi no Uta',
        'Campione!: Matsurowanu Kamigami',
        'to Kamigoroshi no Maou',
        'Joukamachi no Dandelion',
        'Tenkuu no Shiro Laputa',
        'Asobi ni Iku yo!',
        'Shinchou Yuusha: Kono Yuusha ga Ore',
        'Tueee Kuse ni Shinchou Sugiru',
        'Sora no Method',
        'Hataraku Saibou!',
        'Hitsugi no Chaika',
        'Hoshi wo Ou Kodomo',
        'Kaijuu no Kodomo',
        'Kitakubu Katsudou Kiroku',
        'Kuro no Sumika',
        'Youkoso Jitsuryoku Shijou',
        'Shugi no Kyoushitsu e',
        'Code Geass: Hangyaku no Lelouch',
        'Shikabane Hime',
        'Dogeza de Tanondemita',
        'Dungeon ni Deai wo Motomeru no wa',
        'Machigatteiru Darou ka',
        'Dungeon ni Deai wo Motomeru no wa',
        'Machigatteiru Darou ka Gaiden:',
        'Darker than Black: Kuro no Keiyakusha',
        'Death March Kara Hajimaru',
        'Isekai Kyousoukyoku',
        'Makai Toshi Shinjuku',
        'Ichiban Ushiro no Daimaou',
        'Houkago Teibou Nisshi',
        'Inu to Hasami wa Tsukaiyou',
        'Domestic na Kanojo',
        'Ijiranaide, Nagatoro-san',
        'Hisone to Masotan',
        'Seikoku no Dragonar',
        'Jashin-chan Dropkick',
        'Tasogare Otome x Amnesia',
        'Mother - Saigo no Shoujo Eve',
        'Higashi no Eden',
        'Eiken: Eikenbu yori Ai wo Komete',
        'Mikakunin de Shinkoukei',
        'Boku Dake ga Inai Machi',
        'Rakuen Tsuihou',
        'Fooly Cooly, Furi Kuri',
        'Fate/Grand Order: Zettai Majuu',
        'Sensen Babylonia',
        'Enen no Shouboutai',
        'Uchiage Hanabi, Shita kara Miru ka? Yoko kara Miru ka?',
        'Aku no Hana',
        'Shokugeki no Souma',
        'Piano no Mori',
        'Coquelicot-zaka kara',
        'Shinsekai Yori',
        'Kyuukyoku Shinka shita Full Dive RPG ga',
        'Genjitsu yori mo Kusoge Dattara',
        'Hagane no Renkinjutsushi, FMA',
        'Hagane no Renkinjutsushi, FMAB, Sacred Star of Milos',
        'Gate: Jieitai Kanochi nite, Kaku Tatakaeri',
        'Ginga Tansa 2100-nen: Border Planet',
        'Suisei no Gargantia',
        'Garo: Guren no Tsuki',
        'Garo: Honoo no Kokuin',
        'Kikou Souseiki Mospeada',
        'Gakkou no Kaidan',
        'Koukaku Kidoutai',
        'Gintama Gintama\' Gintama Enchousen Gintama° Gintama. Gintama. Porori-henGintama. Shirogane no Tamashii-henGintama°: Aizome Kaori-hen',
        'Kanojo mo Kanojo',
        'Gi(a)rlish Number',
        'Shoujo Shuumatsu Ryokou',
        'Godzilla: S.P',
        'Gokujo. Gokurakuin Joshikou',
        'Ryou Monogatari',
        'Ore, Twintail ni Narimasu.',
        'Binbougami ga!',
        'Koufuku Graffiti',
        'Hotaru no Haka',
        'Great Mazinger vs. Getter Robo',
        'Hai to Gensou no Grimgar',
        'Denpa Onna to Seishun Otoko',
        'Onna Senshi Efe & Jira: Gude no Monshou',
        'Meiou Project Zeorymer',
        'Boku wa Tomodachi ga Sukunai',
        'Hakumei to Mikochi',
        'Hanasaku Iroha',
        'Dounika Naru Hibi',
        'HaruChika - Haruta to Chika wa Seishun suru',
        'Sakamoto desu ga',
        'Jigokuraku',
        'HELLS',
        'Sora no Aosa wo Shiru Hito yo',
        'High Score Girl',
        'Haifuri',
        'Choujin Koukousei-tachi wa Isekai demo',
        'Yoyuu de Ikinuku you desu!, Choyoyu',
        'Gakuen Mokushiroku',
        'High☆Speed! the Movie -Free! Starting Days-',
        'Higurashi no Naku Koro ni',
        'Hinomaru Zumou',
        'Kareshi Kanojo no Jijou',
        'Hachimitsu to Clover',
        'Blazing Transfer Student',
        'Kyoukaisen-jou no Horizon',
        'Sarai-ya Goyou',
        'Dumbbell Nan Kilo Moteru?',
        'Isekai Maou to Shoukan Shoujo no',
        'Dorei Majutsu',
        'Howl no Ugoku Shiro',
        'Jinrui wa Suitai Shimashita',
        'Masou Gakuen HxH',
        'Choujigen Game Neptune The Animation',
        'Danna ga Nani wo Itteiru ka Wakaranai Ken',
        'Yuusha ni Narenakatta Ore wa Shibushibu',
        'Shuushoku wo Ketsui Shimashita.',
        'Kimi no Suizou wo Tabetai',
        'Hashiri Tsuzukete Yokattatte.',
        'Zutto Mae Kara Suki Deshita.: Kokuhaku Jikkou Iinkai',
        'Slime Taoshite 300-nen, Shiranai Uchi',
        'ni Level Max ni Nattemashita',
        'Kanojo ga Flag wo Oraretara',
        'Uchi no Musume',
        'Isekai wa Smartphone to Tomo ni.',
        'Ushinawareta Mirai wo Motomete',
        'Kono Sekai no Katasumi ni',
        'Kunoichi Tsubaki no Mune no Uchi',
        'Leadale no Daichi nite',
        'Kyokou Suiri',
        'Inari, Konkon, Koi Iroha.',
        'IS: Infinite Stratos',
        'Ishuzoku Reviewers',
        'Demi-chan wa Kataritai',
        'Hotarubi no Mori e',
        'Inuyashiki',
        'Rokujouma no Shinryakusha!?',
        'Gochuumon wa Usagi Desu ka?',
        'Kore wa Zombie Desu ka?',
        'Jinsei',
        'Nihon Chinbotsu',
        'Jin-Rou',
        'JoJo no Kimyou na Bouken',
        'Jyu Oh Sei',
        'Kiniro Mosaic',
        'Kono Subarashii Sekai ni Shukufuku wo!',
        'Koutetsujou no Kabaneri',
        'Kaguya-sama wa Kokurasetai:',
        'Tensai-tachi no Renai Zunousen',
        'Kamisama Hajimemashita',
        'Asagao to Kase-san.',
        'Toji no Miko',
        'Eizouken ni wa Te wo Dasu na!',
        'Shijou Saikyou no Deshi Kenichi',
        'History\'s Strongest Disciple Kenichi',
        'Sakamichi no Apollon',
        'Majo no Takkyuubin',
        'Kimi ni Todoke',
        'Kino no Tabi -the Beautiful World-',
        'Watashi ga Motete Dousunda',
        'KissXsis',
        'Maiko-san Chi no Makanai-san',
        'Sidonia no Kishi',
        'Komori-san wa Kotowarenai!',
        'Kono Oto Tomare!',
        'Kuma Miko',
        'Koi to Uso',
        'Yuru Camp△',
        'Houseki no Kuni',
        'Cossette no Shouzou',
        'Hajimari no Boukensha-tachi: Legend of Crystania',
        'Ginga Eiyuu Densetsu',
        'GInga EIyuu Densetsu: Gaiden',
        'Ginga Eiyuu Densetsu: Waga Yuku wa Hoshi no Taikai',
        'Ginga Eiyuu Densetsu: Arata Naru Tatakai no Overture',
        'Ginga Eiyuu Densetsu: Die Neue These',
        'Toshokan Sensou꞉ Kakumei no Tsubasa',
        'Toshokan Sensou',
        'Fantasy Bishoujo Juniku Ojisan to (Fabiniku)',
        'Shiguang Dailiren',
        'Choujin Locke',
        'Hanbun no Tsuki ga Noboru Sora',
        'Lord El-Melloi II Sei no Jikenbo:',
        'Rail Zeppelin Grace Note',
        'Madan no Ou to Vanadis',
        'Omoi, Omoware, Furi, Furare',
        'Chuunibyou demo Koi ga Shitai!',
        'Koi to Senkyo to Chocolate',
        'Lunn wa Kaze no Naka',
        'Macross F',
        'Magia Record: Mahou Shoujo',
        'Madoka☆Magica Gaiden',
        'Mahou Shoujo Ikusei Keikaku',
        'Mahou Shoujo Tokushusen Asuka',
        'Mahou Sensou',
        'Majimoji Rurumo',
        'Mahou Shoujo Nante Mou Ii Desukara.',
        'Mai Mai Shinko to Sennen no Mahou',
        'Manyuu Hikenchou',
        'Maoyuu Maou Yuusha',
        'MAPS: Densetsu no Samayoeru Seijin-tachi',
        'Sayonara no Asa ni Yakusoku no Hana wo Kazarou',
        '3-gatsu no Lion',
        'Junketsu no Maria',
        'Masamune-kun no Revenge',
        'Soushin Shoujo Matoi',
        'Michiko to Hatchin',
        'Sennen Joyuu',
        'Mirai no Mirai',
        'Sunoharasou no Kanrinin-san',
        'Sarusuberi: Miss HOKUSAI',
        'Kobayashi-san Chi no Maidragon',
        'Miyori no Mori',
        'Chiisana Eiyuu',
        'Monster Musume no Iru Nichijou',
        'Gekkan Shoujo Nozaki-kun',
        'Seirei no Moribito',
        'Ramen Daisuki Koizumi-san',
        'Mushishi',
        'Mushoku Tensei: Isekai Ittara Honki Dasu',
        'Sono Bisque Doll wa Koi o Suru',
        'Hajimete no Gal',
        'Boku no Hero Academia',
        'Tonari no Kaibutsu-kun',
        'Ore no Imouto ga Konnani Kawaii Wake ga Nai',
        'Ore Monogatari',
        'NouCome, Ore no Nounai Sentakushi',
        'ga, Gakuen Love Comedy wo Zenryoku',
        'de Jama Shiteiru',
        'Tonari no Totoro',
        'Tonari no Seki-kun',
        'Otome Game no Hametsu Flag shika',
        'Nai Akuyaku Reijou ni Tensei shiteshimatt',
        'Hamefura',
        'Senpai ga Uzai Kouhai no Hanashi',
        'Yahari Ore no Seishun Love',
        'Comedy wa Machigatteiru.',
        'Musaigen no Phantom World',
        'Nazo no Kanojo X',
        'Fushigi no Umi no Nadia',
        'Ryuugajou Nanana no Maizoukin',
        'Natsume Yuujinchou',
        'Kaze no Tani no Nausicaä',
        'Shinseiki Evangelion',
        'Netsuzou TRap',
        'Nichijou',
        'Juubee Ninpuuchou',
        'Nisekoi',
        'No Game No Life: Zero',
        'Nourin',
        'Ima, Soko ni Iru Boku',
        'Araburu Kisetsu no Otome-domo yo.',
        'Ore wo Suki nano wa Omae dake ka yo',
        'ODDTAXI',
        'Ongaku',
        'Isshuukan Friends.',
        'Onii-chan Dakedo Ai Sae Areba',
        'Kankei Nai yo ne!',
        'Because I Don\'t Like My Big Brother At All--!!',
        'Omohide Poro Poro',
        'Tobira o Akete',
        'Ore no Kanojo to Osananajimi',
        'ga Shuraba Sugiru',
        'Urasekai Picnic',
        'Kimi to Boku no Saigo no Senjou, Aruiwa Sekai ga Hajimaru Seisen',
        'Itsudatte Bokura no Koi wa 10cm datta',
        'Kikou Kai Galient',
        'Mousou Dairin',
        'Kiseijuu - Sei no Kakuritsu',
        'Sakasama no Patema',
        'Kidou Keisatsu Patlabor',
        'Mawaru Penguindrum',
        'Peter Grill to Kenja no Jikan',
        'Photon',
        'Pi Po Pa Po Patrol',
        'Planetarian: Chiisana Hoshi no Yume',
        'Oshiete! Galko-chan',
        'Udon no Kuni no Kiniro Kemari',
        'Hakumei no Tsubasa',
        'Pocket Monsters: The Origin',
        'The Rise of Darkrai',
        'Giratina and the Sky Warrior',
        'Zoroark, Master of Illusions',
        'Gake no Ue no Ponyo',
        'Poputepipikku',
        'Kurenai no Buta',
        'Bishounen Tanteidan',
        'PriConne',
        'Mononoke Hime',
        'Kangoku Gakuen',
        'Mondaiji-tachi ga Isekai kara',
        'Kuru Sou Desu yo?',
        'Nerawareta Gakuen',
        'Soujuu Senshi Psychic Wars',
        'Mahou Shoujo Madoka☆Magica',
        'Mahou Shoujo Madoka☆Magica Movies',
        'Rainbow: Nisha Rokubou no Shichinin',
        'Ousama Ranking',
        'Seishun Buta Yarou wa Bunny Girl',
        'Senpai no Yume wo Minai',
        'Koukyuu no Karasu',
        'Re:Zero kara Hajimeru Isekai Seikatsu',
        '3D Kanojo: Real Girl',
        'Jidou Hanbaiki ni Umarekawatta Ore wa Meikyuu o Samayou',
        'Saikin, Imouto no Yousu ga',
        'Chotto Okashiinda ga.',
        'Grancrest Senki',
        'Lodoss-tou Senki',
        'Net-juu no Susume',
        'REDLINE',
        'Kaifuku Jutsushi no Yarinaoshi',
        'Kanojo, Okarishimasu',
        'Isekai Shokudou',
        'Shoujo Kakumei Utena',
        'Kimi to, Nami ni Noretara',
        'Rokka no Yuusha',
        'Sanzoku no Musume Ronja',
        'Heya Camp△',
        'Rosario to Vampire',
        'Versailles no Bara',
        'Kimi ga Nozomu Eien',
        'Kaze ga Tsuyoku Fuiteiru',
        'Shimoneta to Iu Gainen ga Sonzai Shinai',
        'Taikutsu na Sekai',
        'SK∞',
        'SPY×FAMILY',
        'Saenai Heroine no Sodatekata',
        'Youjo Senki',
        'Sakurada Reset',
        'Gakkou Gurashi!',
        'Rikei ga Koi ni Ochita no de Shoumei shitemita.',
        'Kuzu no Honkai',
        'Asa Made Jugyou Chu!',
        'Senryuu Shoujo',
        'Owari no Seraph',
        'sin: Nanatsu no Taizai',
        'Kanojo to Kanojo no Neko: Everything Flows',
        'Ore ga Ojousama Gakkou ni "Shomin Sample"',
        'Toshite Gets♥Sareta Ken',
        'Shounen Maid',
        'Gin no Saji',
        'Yesterday wo Uttate',
        'Runway de Waratte',
        'Akagami no Shirayuki-hime',
        'Dakara Boku wa, H ga Dekinai.',
        'Somali to Mori no Kamisama',
        'Sora no Woto',
        'Hibike! Euphonium',
        'Uchuu Kyoudai',
        'Space☆Dandy',
        'Uchuu Patrol Luluco',
        'Ookami to Koushinryou',
        'Sen to Chihiro no Kamikakushi',
        'Uchuu Senkan Yamato',
        'Uchuu Senkan Yamato 2199',
        'Steins;Gate Movie: Fuka Ryouiki no Déjà vu',
        'Stella Jogakuin Koutou-ka C³-bu',
        'Ichigo Mashimaro',
        'Kamisama no Inai Nichiyoubi',
        'Chou Kousoku Galvion',
        'Suzume no Tojimari',
        'Aoi Hana',
        'Stranger: Mukou Hadan',
        'Senki Zesshou Symphogear',
        'Tonikaku Kawaii',
        'Tada-kun wa Koi wo Shinai',
        'TAILENDERS',
        'Taishou Otome Otogibanashi',
        'Munou na Nana',
        'Ged Senki',
        'Tamako Love Story',
        'Tanaka-kun wa Itsumo Kedaruge',
        'Karakai Jouzu no Takagi-san',
        'Uchuu no Kishi Tekkaman Blade',
        'Isekai no Seikishi Monogatari',
        'Zankyou no Terror',
        'Tetsujin 28-gou',
        'Tensei shitara Slime Datta Ken',
        'Hentai Ouji to Warawanai Neko.',
        'Oda Nobuna no Yabou',
        'Mahoutsukai no Yome',
        'Otonari no Tenshi-sama ni Itsunomanika Dame Ningen ni Sareteita Ken',
        'Kokoro ga Sakebitagatterunda.',
        'Gakusen Toshi Asterisk',
        'Bakemono no Ko',
        'Vanitas no Carte',
        'Hana to Alice: Satsujin Jiken',
        'Neko no Ongaeshi',
        'Mangaka-san to Assistant-san to',
        'Boku no Kokoro no Yabai Yatsu',
        'Kamisama ni Natta Hi',
        'Machikado Mazoku',
        'Tantei wa Mou, Shindeiru.',
        'Hataraku Maou-sama!',
        'Saiki Kusuo no Ψ-nan',
        'Saiki Kusuo no Ψ-nan: Kanketsu-hen',
        'Saiki Kusuo no Ψ-nan: Ψ-shidou-hen',
        'Ryuu no Haisha',
        'Meikyuu Black Company',
        'Uchouten Kazoku',
        'Kage no Jitsuryokusha ni Naritakute!',
        'Shisha no Teikoku',
        'Nekogami Yaoyorozu',
        'Saihate no Paladin',
        'Kara no Kyoukai',
        'Kotonoha no Niwa',
        'Tensai Ouji no Akaji Kokka Saisei Jutsu',
        'Totsukuni no Shoujo',
        'Toki wo Kakeru Shoujo',
        'Fune wo Amu',
        'Midori no Neko',
        'Sewayaki Kitsune no Senko-san',
        'Heion Sedai no Idaten-tachi',
        'Mahouka Koukou no Rettousei',
        'Bokura wa Minna Kawai-sou',
        'Kubikiri Cycle: Aoiro Savant to Zaregototsukai',
        'Densetsu no Yuusha no Densetsu',
        'Tensei Oujo to Tensai Reijou no Mahou Kakumei',
        'Kouya no Kotobuki Hikoutai',
        'Suzumiya Haruhi no Yuuutsu',
        'Maou Gakuin no Futekigousha',
        'Suki ni Naru Sono Shunkan wo.: Kokuhaku Jikkou Iinkai',
        'Dantalian no Shoka',
        'Yoru wa Mijikashi Arukeyo Otome',
        'Subete ga F ni Naru',
        'Sakurasou no Pet na Kanojo',
        'Kumo no Mukou, Yakusoku no Basho',
        'Tennis no Ouji-sama',
        'Toaru Hikuushi e no Tsuioku',
        'Yakusoku no Neverland',
        'Gotoubun no Hanayome',
        'Seikon no Qwaser',
        'Ashita Sekai ga Owaru to Shite mo',
        'Tate no Yuusha no Nariagari',
        'Ryuuou no Oshigoto!',
        'Seijo no Maryoku wa Bannou Desu',
        'Karigurashi no Arrietty',
        'Nanatsu no Taizai',
        'Dansai Bunri no Crime Edge',
        'Saiunkoku Monogatari',
        'Yojouhan Shinwa Taikei',
        'Shinmai Maou no Testament',
        'Juuni Kokuki',
        'Tenkuu no Escaflowne',
        'Kaze Tachinu',
        'Soredemo Sekai wa Utsukushii',
        'Sekai Saikou no Ansatsusha, Isekai Kizoku ni Tensei suru',
        'Mashiro no Oto',
        'Eve no Jikan',
        'Fumetsu no Anata e',
        'Emiya-san Chi no Kyou no Gohan',
        'Akagi',
        'Terra e...',
        'Kami no Tou',
        'Tsuki ga Michibiku Isekai Douchuu',
        'Tsurezure Children',
        'Futatsu no Spica',
        'Taifuu no Noruda',
        'Un-Go: Inga-ron',
        'Ulysses: Jeanne d\'Arc to Renkin no Kishi',
        'Uma Musume: Pretty Derby',
        'Umineko no Naku Koro ni',
        'Machine-Doll wa Kizutsukanai',
        'Isekai Oji-san',
        'Saijaku Muhai no Bahamut',
        'Juuou Mujin no Fafnir',
        'Urara Meirochou',
        'Uzaki-chan wa Asobitai!',
        'Kakumeiki Valvrave',
        'Venus Senki',
        'Watashi ga Motenai no wa Dou',
        'Kangaetemo Omaera ga Warui!',
        'Watashi ni Tenshi ga Maiorita!',
        'selector infected WIXOSS',
        'selector spread WIXOSS',
        'Lostorage incited WIXOSS',
        'Lostorage conflated WIXOSS',
        'WWW.WAGNARIA!!',
        'Hourou Musuko',
        'Majo no Tabitabi',
        'Sekai de Ichiban Tsuyoku Naritai!',
        'Bokutachi wa Benkyou ga Dekinai',
        'Tenki no Ko',
        'Uchuu Show e Youkoso',
        'Ballroom e Youkoso',
        'NHK ni Youkoso',
        'Omoide no Marnie',
        'Inou-Battle wa Nichijou-kei no Naka de',
        'Mimi wo Sumaseba',
        'Sasameki Koto',
        'Nande Koko ni Sensei ga!?',
        'Youjuu Toshi',
        'Ookami Kodomo no Ame to Yuki',
        'Ookami Shoujo to Kuro Ouji',
        'Seiken Tsukai no World Break',
        'Sekai Seifuku: Bouryaku no Zvezda',
        'Shuumatsu Nani Shitemasu ka? Isogashii Desu ka? Sukutte Moratte Ii Desu ka?',
        'Wotaku ni Koi wa Muzukashii',
        'Bounen no Xamdou',
        'Yamada-kun to 7-nin no Majo',
        'B Gata H Kei',
        'Yamatarou Kaeru',
        'Hanyou no Yashahime: Sengoku Otogizoushi',
        'Yokohama Shopping Log',
        'Akatsuki no Yona',
        'Yosuga no Sora',
        'Kimi to Boku.',
        'Shigatsu wa Kimi no Uso',
        'Kimi no Na wa.',
        'Yuu☆Yuu☆Hakusho',
        'Yuri Kuma Arashi',
        'ef: A Tale of Memories/Melodies'];
      const aliasesRegex = aliases.map(alias => new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'));
      const showNameWithoutAliases = aliasesRegex.reduce((name, aliasRegex) => name.replace(aliasRegex, ''), filteredShowName);


      const showName = showNameWithoutAliases.trim() || '';


    const seasonRegex = /(?:Season|S|Arc)\s*(\d+|Arc)/i;
    let seasonMatch;
    let season = 'S01';

    // Check if the season information is already in the title
    const seasonAlreadyInTitle = originalTitle.match(/S\d+/i);
    if (!seasonAlreadyInTitle) {
      seasonMatch = originalTitle.match(seasonRegex);
      season = seasonMatch ? `S${seasonMatch[1]}` : 'S01';
    }

    const sourceRegex = /\b(?:BD(?:-?rip)?|BluRay|WEB(?:-?rip)?|HDTV(?:-?WEB)?|DVD(?:-?rip)?|JPBD|USBD|ITABD|R1\s?DVD|R2\s?DVD|R2J|R1J)\b/i;
    const sourceMatch = originalTitle.match(sourceRegex);
    const source = sourceMatch ? sourceMatch[0] : '';

    const resolutionRegex = /\b(?<!264|265)(?:(\d{3,4}x\d{3,4})|([1-9]\d{2,3}p))\b/;
const resolutionMatch = originalTitle.match(resolutionRegex);
let resolution;

if (resolutionMatch) {
  // Check if it's "p" format
  if (resolutionMatch[2]) {
    resolution = resolutionMatch[2]; // Use the second group for "p" formats (e.g., "1080p")
  } else if (resolutionMatch[1]) {
    resolution = resolutionMatch[1]; // Use the first group for resolutions in the format "1920x1080"
  } else {
    resolution = 'Unknown'; // Handle cases where neither format matches
  }
} else {
  // Handle no resolution case
  resolution = 'Unknown'; // or any custom fallback value
}

    const versionRegex = /\bv[0-4]\b/i;
    const versionMatch = originalTitle.match(versionRegex);
    const version = versionMatch ? ` ${versionMatch[0]}` : '';

    const isOvaOrSpecial = filteredWords.some(word => originalTitle.toLowerCase().includes(word));
    const additionalSuffix = isOvaOrSpecial ? ` ${filteredWords.find(word => originalTitle.toLowerCase().includes(word))?.toUpperCase()}` : '';

    const formattedTitle = `[${releaseGroup}] ${showName} ${season} ${source} ${resolution}${additionalSuffix}${version}`;

    return formattedTitle.trim();
  }


  public async get(
    anime: { title: string; alias: string },
    sneedexData: ISneedexRelease
  ): Promise<ITorrentRelease[]> {
    const bestReleaseLinks = sneedexData.best_links.length
      ? sneedexData.best_links.split(' ')
      : sneedexData.alt_links.split(' ');

    const nyaaLinks = bestReleaseLinks.filter((url: string) =>
      url.includes('nyaa.si/view/')
    );
    const nyaaIDs = nyaaLinks.length
      ? nyaaLinks.map((url: string) => +url.match(/nyaa.si\/view\/(\d+)/)[1])
      : null;

    const nyaaData = nyaaIDs
      ? await Promise.all(
          nyaaIDs.map(async (nyaaID: number) => {
            const nyaaData = await this.fetch(`${nyaaID}`);
            return nyaaData;
          })
        )
      : null;

    if (!nyaaData) return null;

    const releases: ITorrentRelease[] = nyaaData.map((data: INyaaData) => {
      const formattedTitle = this.formatTitle(data.title);

      const size = data.size.split(' ');
      const sizeInBytes =
        size[1] === 'GiB'
          ? +size[0] * 1024 * 1024 * 1024
          : +size[0] * 1024 * 1024;

      const sizeInBytesRounded = Math.round(sizeInBytes);

      const formattedDate = Utils.formatDate(
        new Date(data.date.replace(' UTC', '')).getTime()
      );

      return {
        title: formattedTitle,
        link: `https://nyaa.si/view/${data.id}`,
        url: `https://nyaa.si/download/${data.id}.torrent`,
        seeders: data.seeders,
        leechers: data.leechers,
        infohash: data.infohash,
        size: sizeInBytesRounded,
        files: data.files,
        timestamp: formattedDate,
        grabs: data.completed,
        type: 'torrent'
      };
    });

    return releases as ITorrentRelease[];
  }
}
