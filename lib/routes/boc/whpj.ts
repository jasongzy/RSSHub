import { Route } from '@/types';
import got from '@/utils/got';
import { load } from 'cheerio';

export const route: Route = {
    path: '/whpj/:format?',
    categories: ['other'],
    example: '/boc/whpj/zs?filter_title=%E8%8B%B1%E9%95%91',
    parameters: { format: '输出的标题格式，默认为标题 + 所有价格。短格式仅包含货币名称。' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['boc.cn/sourcedb/whpj', 'boc.cn/'],
            target: '/whpj',
        },
    ],
    name: '外汇牌价',
    maintainers: ['LogicJake', 'HenryQW'],
    handler,
    url: 'boc.cn/sourcedb/whpj',
    description: `| 短格式 | 中行折算价 | 现汇买卖 | 现钞买卖 | 现汇买入 | 现汇卖出 | 现钞买入 | 现钞卖出 |
| ------ | ---------- | -------- | -------- | -------- | -------- | -------- | -------- |
| short  | zs         | xh       | xc       | xhmr     | xhmc     | xcmr     | xcmc     |`,
};

async function handler(ctx) {
    const link = 'https://www.boc.cn/sourcedb/whpj/';
    const response = await got(link);
    const $ = load(response.data);

    const format = ctx.req.param('format');

    const en_names = {
        阿联酋迪拉姆: 'AED',
        澳大利亚元: 'AUD',
        巴西里亚尔: 'BRL',
        加拿大元: 'CAD',
        瑞士法郎: 'CHF',
        丹麦克朗: 'DKK',
        欧元: 'EUR',
        英镑: 'GBP',
        港币: 'HKD',
        印尼卢比: 'IDR',
        印度卢比: 'INR',
        日元: 'JPY',
        韩国元: 'KRW',
        澳门元: 'MOP',
        林吉特: 'MYR',
        挪威克朗: 'NOK',
        新西兰元: 'NZD',
        菲律宾比索: 'PHP',
        卢布: 'RUB',
        沙特里亚尔: 'SAR',
        瑞典克朗: 'SEK',
        新加坡元: 'SGD',
        泰国铢: 'THB',
        土耳其里拉: 'TRY',
        新台币: 'TWD',
        美元: 'USD',
        南非兰特: 'ZAR',
    };

    const out = $('div.publish table tbody tr')
        .slice(2)
        .toArray()
        .map((e) => {
            e = $(e);
            const zh_name = e.find('td:nth-child(1)').text();
            const en_name = en_names[zh_name] || '';
            const name = `${zh_name} ${en_name}`;
            const date = e.find('td:nth-child(7)').text();

            const xhmr = `现汇买入价：${e.find('td:nth-child(2)').text()}`;

            const xcmr = `现钞买入价：${e.find('td:nth-child(3)').text()}`;

            const xhmc = `现汇卖出价：${e.find('td:nth-child(4)').text()}`;

            const xcmc = `现钞卖出价：${e.find('td:nth-child(5)').text()}`;

            const zs = `中行折算价：${e.find('td:nth-child(6)').text()}`;

            const content = `${xhmr} ${xcmr} ${xhmc} ${xcmc} ${zs}`;

            const formatTitle = () => {
                switch (format) {
                    case 'short':
                        return name;
                    case 'xh':
                        return `${name} ${xhmr} ${xhmc}`;
                    case 'xc':
                        return `${name} ${xcmr} ${xcmc}`;
                    case 'zs':
                        return `${name} ${zs}`;
                    case 'xhmr':
                        return `${name} ${xhmr}`;
                    case 'xhmc':
                        return `${name} ${xhmc}`;
                    case 'xcmr':
                        return `${name} ${xcmr}`;
                    case 'xcmc':
                        return `${name} ${xcmc}`;
                    default:
                        return `${name} ${content}`;
                }
            };

            const info = {
                title: formatTitle(),
                description: content.replaceAll(/\s/g, '<br>'),
                pubDate: new Date(date).toUTCString(),
                guid: `${name} ${content}`,
            };
            return info;
        });

    return {
        title: '中国银行外汇牌价',
        link,
        item: out,
    };
}
