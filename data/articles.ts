/**
 * サポートメニューに掲載するおすすめ記事リンク。
 * 追加・削除・並べ替えはこのファイルだけを編集すればよい。
 */
export interface ArticleLink {
  title: string;
  description: string;
  author: string;
  category: string;
  url: string;
}

export const MAGAZINE_ARTICLES: ArticleLink[] = [
  {
    title: '▼稼ぎ方実践講座「価格の決め方」',
    description: 'ビジネスをやるときに悩むことランキング上位、いくらで売るか。',
    author: '学長マガジンチャット',
    category: '価格',
    url: 'https://libecity.com/room_list?room_id=President-Tweet&comment_id=nxfgYlqV2Eb3Lh2YOhPS',
  },
  {
    title: '嫌われない宣伝方法の話〜上手に宣伝し〜や〜〜',
    description: '商品やサービスは作っただけじゃ売れへん！リベッターを活用した宣伝方法',
    author: '学長マガジンチャット',
    category: '宣伝',
    url: 'https://libecity.com/room_list?room_id=President-Tweet&comment_id=ifrXKHuX4QbUTwkPSG7Y',
  },
];

export const KNOWHOW_ARTICLES: ArticleLink[] = [
  {
    title: '【無料で使える！】スキルマーケットOnline構造診断ツール',
    description: '既に出している商品を「今後も出し続けるか、中身を見直すか」を判定してくれる診断ツール',
    author: 'おれんじ🍊スプシで稼ぐチャット管理人',
    category: '改善',
    url: 'https://library.libecity.com/articles/01KE4E7JX9ZR77663JV9JDW77T',
  },
  {
    title: '【売上120%UP】スキルマーケットで自分のサービスを改善する３つのポイント',
    description: 'サービスを出してみたけど中々売れない…そんなときに見直すべき３つのポイントと判断基準',
    author: 'みずの＠寄り添うWebデザイナー',
    category: '改善',
    url: 'https://library.libecity.com/articles/01HHE5SC4C5KE81R4AT2CZB25F',
  },
  {
    title: "リベシティプロフィールを『あなたらしい』文章にするコツと例文をご紹介",
    description: 'プロフィールに何を書けばいいか迷う方へ、項目ごとの書き方をご紹介',
    author: 'ベリー号🚢採用支援×HPライター',
    category: 'プロフィール',
    url: 'https://library.libecity.com/articles/01HKR0A1C9G6NMTDXKC18QVRD2',
  },
  {
    title: '信頼を貯めるリベプロフィールの書き方＊考え方を解説＊',
    description: '認知されているのに依頼が来ない…信頼につながるプロフィールの考え方',
    author: 'ベリー号🚢採用支援×HPライター',
    category: 'プロフィール',
    url: 'https://library.libecity.com/articles/01K1Z2F6Z0QPR83FPG558EP2PT',
  },
  {
    title: '【デザイン苦手でも大丈夫！】"見られるサムネイル"の作り方',
    description: 'Canva初心者さん向けに、出品用サムネイルの作り方を7ステップで解説',
    author: 'まい＠戦略企画×クリエイター',
    category: 'デザイン',
    url: 'https://library.libecity.com/articles/01JY8232SXV4X9QHDSG3DW15H2',
  },
  {
    title: '知ってもらわないとモノは売れない【人見知りさん必見！】oviceで認知活動',
    description: '話しかけるのが苦手ならoviceで話しかけてもらえばいい！を実践した認知活動の記録',
    author: 'パー子＠おしゃべりなお絵描き屋さん',
    category: '宣伝',
    url: 'https://library.libecity.com/articles/01JB6VCAG87W05WFBGMN27EP1V',
  },
];
