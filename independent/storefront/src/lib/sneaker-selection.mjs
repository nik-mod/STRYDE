// Conservative filename-based selection. Unknown model families stay hidden.
// This selects a presentation category; it does not certify product identities.
const excluded =
  /\b(?:slides?|sandals?|flip flops?|clogs?|mules?|boots?|heels?|pumps|loafers?|espadrilles?|derby|oxfords?|brogues?|slippers?|moccasins?|mary jane|chelsea|jodhpur|wedges?|stiletto|ballet|snow|cleats?|football|soccer|rugby|baseball|golf|mercurial|magista|tiempo|hypervenom|phantom venom|phantom vision|vapor edge|vapor untouchable|force savage|alpha menace|landshark|benassi|kawa|victori|sunray|deschutz|foam runner|foam rnnr|adi(?:lette|lu)|cloudrock|princetown|jordaan|beatnik|4040\w*|3000\w*|predator|nemeziz|copa|f50|phantom gt|phantom gx|phantom luna|wallabee|desert trek|desert boot|tabi flat)\b/i;
const families = {
  Nike: /\b(?:air (?:force|max|presto|huarache|rift|vapormax|foamposite|flight|penny|more|uptempo|trainer|tech challenge|tuned|streak|skylon|terra)|dunk|blazer|cortez|killshot|waffle|daybreak|challenger|tailwind|ldwaffle|ldv|sacai|v2k|p ?6000|pegasus|vomero|zoom|free|react|roshe|lebron|kobe|kyrie|kd|pg|freak|ja|book|sabrina|ebernon|court|sb|hyperdunk|hyperrev|precision|k air|ispa|shox|space hippie|crater|acg mountain fly|acg lowcate|acg antarktik|lunarglide|lunar epic|lunar force|lunar flyknit|flyknit racer|flyknit trainer|flyknit max|flyknit lunar|metcon|romaleos|invincible|alphafly|vaporfly|superrep|winflo|downshifter|revolution|initiator|defy all day|tekno|m2k|monarch|vandal|terminator|gts|g t|gt (?:cut|jump|hustle))\b/i,
  Jordan: /\b(?:jordan|jumpman|westbrook|why not|zion|luka|tatum)\b/i,
  adidas:
    /\b(?:samba|gazelle|superstar|stan smith|campus|forum|handball|spezial|sl ?72|ultra ?boost|pure ?boost|nmd|zx|yeezy|ozweego|ozelia|ozmillen|adimatic|eqt|rivalry|continental|powerphase|sneaker|trainer|top ten|country|iniki|i ?5923|falcon|sobakov|dragon|nizza|supercourt|response|retropy|adi2000|adi ?2000|busenitz|tyshawn|harden|dame|d rose|don issue|crazy|a e ?1|ae ?1|adizero|adistar|supernova|4d|alpha ?bounce|prophere|sleek|x plr)\b/i,
  "New Balance":
    /\b(?:[umwrc]?\d{2,3}[a-z0-9]*|9060|1906\w*|2002\w*|2040\w*|xc ?72|ct ?302|fresh foam|fuelcell|numeric|comp ?100|all coasts|crv|vision racer|rainier low)\b/i,
  ASICS:
    /\b(?:gel|gt|ex ?89|japan s|skyhand|tarther|novablast|superblast|metaspeed|lyte|quantum)\b/i,
  Asics:
    /\b(?:gel|gt|ex ?89|japan s|skyhand|tarther|novablast|superblast|metaspeed|lyte|quantum)\b/i,
  "Onitsuka Tiger":
    /\b(?:mexico|serrano|tai chi|california|delegation|gsm|corsair|ultimate|edr|moage|ohbori)\b/i,
  Salomon:
    /\b(?:xt|acs|speedcross|speedverse|sense ride|s lab|s ?lab|rx snow moc|odyssey|pulsar|xa pro)\b/i,
  Converse:
    /\b(?:all star|chuck|one star|run star|weapon|pro leather|jack purcell|gianno|aeon|erx|fastbreak)\b/i,
  Vans: /\b(?:era|old skool|authentic|sk8|slip on|half cab|style \d|ultrarange|lowland|chukka|knu|rowley|sport|og|ave|vault|cruze|bold|skate)\b/i,
  Reebok:
    /\b(?:club c|classic|nano|instapump|pump|shaq|kamikaze|question|answer|workout|legacy|rapide|aztrek|dmx|zig|kinetica|phase|bb ?4000|bb ?4600|freestyle|ex o fit|exofit|beatnik|premier|ventilator)\b/i,
  Puma: /\b(?:suede|palermo|clyde|rs|cell|rider|slipstream|mb ?0[1-9]|all pro|speedcat|mostro|trinomic|tsugi|disc|thunder|trc|blaze|wild|calibrate|rebound|carina|mayze|cali|smash|softride|enzo|nitro|deviate|court|basket|roma|ralph sampson)\b/i,
  Saucony:
    /\b(?:shadow|jazz|grid|progrid|azura|omni|ride|kinvara|endorphin|triumph|dxn|master control)\b/i,
  Hoka: /\b(?:clifton|bondi|rincon|mach|speedgoat|challenger|mafate|transport|arahi|gaviota|carbon|rocket|zinal)\b/i,
  On: /\bcloud(?!rock)\w*/i,
  "Golden Goose":
    /\b(?:super ?star|ball ?star|mid ?star|pure ?star|sky ?star|running sole|stardan|francy|dad star|v star|soul star)\b/i,
  "Maison Margiela": /\b(?:replica|evolution|future|runner|sneaker)\b/i,
  Gucci:
    /\b(?:ace|rhyton|screener|tennis|ultrapace|run|sneaker|trainer|basket|mac80)\b/i,
  Balenciaga:
    /\b(?:triple s|track|speed|runner|defender|cargo|phantom|circuit|3xl|6xl|10xl|paris|stapler|zen)\b/i,
  Dior: /\b(?:b ?(?:01|22|23|25|27|30|31|33)|walk n dior|walkndior|cd ?1|sneaker|trainer)\b/i,
  "Louis Vuitton":
    /\b(?:trainer|archlight|skate|run away|runaway|run ?55|charlie|frontrow|front row|time out|timeout|sneaker)\b/i,
  Versace:
    /\b(?:chain reaction|trigreca|odyssey|squalo|odissea|greca|sneaker|trainer)\b/i,
  "A Bathing Ape": /\b(?:bape|bapesta|court sta|road sta|sk8|sta)\b/i,
  "Off-White":
    /\b(?:vulc|out of office|off court|odsy|odyssey|be right back|sneaker|trainer|arrow)\b/i,
  "Common Projects":
    /\b(?:achilles|bball|basketball|track|retro|sneaker|tournament)\b/i,
  "Axel Arigato":
    /\b(?:dice|clean|marathon|area|genesis|orbit|rush|sneaker)\b/i,
  Autry: /\b(?:medalist|dallas|reelwind|sneaker)\b/i,
  Diadora:
    /\b(?:n ?9000|n ?902|b elite|v ?7000|intrepid|camaro|maverick|rebound ace|s8000|s ?8000)\b/i,
  Mizuno: /\b(?:wave|contender|sky medal|city wind|mondo control)\b/i,
  Karhu: /\b(?:fusion|aria|synchron|legacy|albatross|mestari|trampas)\b/i,
  Fendi: /\b(?:flow|match|faster|sneaker|trainer)\b/i,
  "Palm Angels": /\b(?:palm one|court|university|vulcanized|sneaker)\b/i,
  Veja: /\b(?:v ?10|v ?12|campo|esplar|venturi|rio branco|sdu|dekkan|condor|roraima|sneaker)\b/i,
};
export function isSneaker(item) {
  const title = String(item.title || "").replace(/[-_/]+/g, " ");
  if (
    /\b(?:sneakerboots?|duckboots?|workboots?|goadome|foamdome|booties?|derbies|driving|moc)\b/i.test(
      title,
    )
  )
    return false;
  if (/\byeezy\s+950\b/i.test(title)) return false;
  if (
    /\b(?:bags?|backpacks?|wallets?|socks|shirts?|jackets?|hoodies?|pants?|caps?|hats?)\b/i.test(
      title,
    )
  )
    return false;
  if (excluded.test(title)) return false;
  if (/\b(?:sneakers?|trainers?)\b/i.test(title)) return true;
  return Boolean(families[item.brand]?.test(title));
}
export function hasSharpSneakerPhoto(item) {
  return (
    isSneaker(item) &&
    item.imageQuality?.status === "ready" &&
    item.imageQuality.width >= 800 &&
    item.imageQuality.height >= 200
  );
}
