/**
 * API Endpoint: GET /api/clickstr/nft/:tokenId
 *
 * Reference implementation for mann.cool API
 * Returns ERC1155 metadata JSON for a given token ID (tier)
 *
 * ERC1155 metadata standard: https://eips.ethereum.org/EIPS/eip-1155#metadata
 *
 * The contract's uri() function returns: baseURI + tokenId
 * e.g., "https://mann.cool/api/clickstr/nft/1"
 *
 * Tier Ranges:
 *   1-99:    Personal click milestones (editions)
 *   100-199: Streak/special achievements (editions)
 *   200-499: Global milestones - 1/1s (meme numbers, palindromes, etc.)
 *   500+:    Hidden personal achievements (editions)
 */

// Token metadata definitions
// Token ID = Tier number
const TOKEN_METADATA = {
  // ============================================
  // PERSONAL MILESTONES (Editions - Tier 1-99)
  // ============================================
  1: {
    name: "First Timer",
    description: "Made your first click in Stupid Clicker. Everyone starts somewhere!",
    clicks: 1,
    category: "personal",
    rarity: "common",
  },
  2: {
    name: "Getting Started",
    description: "100 clicks and counting. You're getting the hang of this.",
    clicks: 100,
    category: "personal",
    rarity: "common",
  },
  3: {
    name: "Warming Up",
    description: "500 clicks completed. Your fingers are warmed up now.",
    clicks: 500,
    category: "personal",
    rarity: "common",
  },
  4: {
    name: "Dedicated",
    description: "1,000 clicks. You're officially dedicated to the cause.",
    clicks: 1000,
    category: "personal",
    rarity: "uncommon",
  },
  5: {
    name: "Serious Clicker",
    description: "5,000 clicks. This is getting serious.",
    clicks: 5000,
    category: "personal",
    rarity: "uncommon",
  },
  6: {
    name: "Obsessed",
    description: "10,000 clicks. Some might say you're obsessed. They're right.",
    clicks: 10000,
    category: "personal",
    rarity: "rare",
  },
  7: {
    name: "No Sleep",
    description: "25,000 clicks. Sleep is for the weak.",
    clicks: 25000,
    category: "personal",
    rarity: "rare",
  },
  8: {
    name: "Touch Grass",
    description: "50,000 clicks. When did you last go outside?",
    clicks: 50000,
    category: "personal",
    rarity: "epic",
  },
  9: {
    name: "Legend",
    description: "100,000 clicks. You've achieved legendary status.",
    clicks: 100000,
    category: "personal",
    rarity: "epic",
  },
  10: {
    name: "Ascended",
    description: "250,000 clicks. You have transcended mortal clicking.",
    clicks: 250000,
    category: "personal",
    rarity: "legendary",
  },
  11: {
    name: "Transcendent",
    description: "500,000 clicks. Beyond human comprehension.",
    clicks: 500000,
    category: "personal",
    rarity: "legendary",
  },
  12: {
    name: "Click God",
    description: "1,000,000 clicks. You are the Click God. All bow before you.",
    clicks: 1000000,
    category: "personal",
    rarity: "mythic",
  },

  // ============================================
  // STREAK ACHIEVEMENTS (Editions - Tier 101-103)
  // ============================================
  101: {
    name: "Week Warrior",
    description: "Clicked for 7 consecutive days. Consistency is key!",
    streak: 7,
    category: "streak",
    rarity: "uncommon",
  },
  102: {
    name: "Month Master",
    description: "Clicked for 30 consecutive days. A month of dedication.",
    streak: 30,
    category: "streak",
    rarity: "rare",
  },
  103: {
    name: "Perfect Attendance",
    description: "Clicked every single day for 90 days. Perfection achieved.",
    streak: 90,
    category: "streak",
    rarity: "legendary",
  },

  // ============================================
  // EPOCH ACHIEVEMENTS (Editions - Tier 104-105)
  // ============================================
  104: {
    name: "Day One OG",
    description: "Participated in Epoch 1. You were there from the very beginning.",
    epoch: 1,
    category: "epoch",
    rarity: "epic",
  },
  105: {
    name: "The Final Day",
    description: "Participated in the final epoch. You saw it through to the end.",
    epoch: "final",
    category: "epoch",
    rarity: "epic",
  },

  // ============================================
  // GLOBAL MILESTONES - 1/1s (Tier 200-499)
  // Only one person can ever own each of these
  // ============================================

  // --- Main round number milestones ---
  200: {
    name: "The First Click",
    description: "THE first click ever in Stupid Clicker. Historical.",
    globalClick: 1,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  201: {
    name: "Nice",
    description: "Triggered global click #69. Nice.",
    globalClick: 69,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  202: {
    name: "Century",
    description: "Triggered global click #100. A century of clicks.",
    globalClick: 100,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  203: {
    name: "Blaze It",
    description: "Triggered global click #420.",
    globalClick: 420,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  204: {
    name: "Devil's Click",
    description: "Triggered global click #666. Devilish.",
    globalClick: 666,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  205: {
    name: "Lucky Sevens",
    description: "Triggered global click #777. Triple lucky!",
    globalClick: 777,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  206: {
    name: "Thousandaire",
    description: "Triggered global click #1,000.",
    globalClick: 1000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  207: {
    name: "Elite",
    description: "Triggered global click #1,337. Leet.",
    globalClick: 1337,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  208: {
    name: "Ten Grand",
    description: "Triggered global click #10,000.",
    globalClick: 10000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  209: {
    name: "The Hundred Thousandth",
    description: "Triggered global click #100,000.",
    globalClick: 100000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  210: {
    name: "The Millionth Click",
    description: "Triggered global click #1,000,000. One in a million, literally.",
    globalClick: 1000000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  211: {
    name: "Ten Million",
    description: "Triggered global click #10,000,000.",
    globalClick: 10000000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  212: {
    name: "Halfway There",
    description: "Triggered global click #50,000,000. Halfway to the goal!",
    globalClick: 50000000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  213: {
    name: "The Final Click",
    description: "THE final click. Global click #100,000,000. It's over.",
    globalClick: 100000000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },

  // --- Meme Numbers ---
  220: {
    name: "Calculator Word",
    description: "Triggered global click #8,008. BOOB upside down.",
    globalClick: 8008,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  221: {
    name: "The Perfect Number",
    description: "Triggered global click #42,069. Nice + 42.",
    globalClick: 42069,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  222: {
    name: "Ultra Nice",
    description: "Triggered global click #69,420.",
    globalClick: 69420,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  223: {
    name: "Old School",
    description: "Triggered global click #80,085. BOOBS.",
    globalClick: 80085,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  224: {
    name: "Double Blaze",
    description: "Triggered global click #420,420.",
    globalClick: 420420,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  225: {
    name: "Maximum Evil",
    description: "Triggered global click #666,666.",
    globalClick: 666666,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  226: {
    name: "Nice Nice Nice",
    description: "Triggered global click #696,969.",
    globalClick: 696969,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  227: {
    name: "Elite Blaze",
    description: "Triggered global click #1,337,420.",
    globalClick: 1337420,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  228: {
    name: "Ridiculously Nice",
    description: "Triggered global click #6,969,696.",
    globalClick: 6969696,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  229: {
    name: "Calculator Masterpiece",
    description: "Triggered global click #8,008,135. BOOBIES.",
    globalClick: 8008135,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  230: {
    name: "Meaning of Nice",
    description: "Triggered global click #42,042,069.",
    globalClick: 42042069,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  231: {
    name: "Nice Round Blaze",
    description: "Triggered global click #69,420,000.",
    globalClick: 69420000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  232: {
    name: "Trinity Blaze",
    description: "Triggered global click #420,420,420.",
    globalClick: 420420420,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  233: {
    name: "The Beast",
    description: "Triggered global click #666,666,666.",
    globalClick: 666666666,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  234: {
    name: "Absurdly Nice",
    description: "Triggered global click #696,969,696.",
    globalClick: 696969696,
    category: "global",
    rarity: "mythic",
    unique: true,
  },

  // --- Repeated Digits ---
  240: {
    name: "Triple Ones",
    description: "Triggered global click #111.",
    globalClick: 111,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  241: {
    name: "Quad Ones",
    description: "Triggered global click #1,111.",
    globalClick: 1111,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  242: {
    name: "Make a Wish",
    description: "Triggered global click #11,111.",
    globalClick: 11111,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  243: {
    name: "Six Ones",
    description: "Triggered global click #111,111.",
    globalClick: 111111,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  244: {
    name: "Lucky Sevens (Ones)",
    description: "Triggered global click #1,111,111.",
    globalClick: 1111111,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  245: {
    name: "Eight Ones",
    description: "Triggered global click #11,111,111.",
    globalClick: 11111111,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  246: {
    name: "Nine Ones",
    description: "Triggered global click #111,111,111.",
    globalClick: 111111111,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  247: {
    name: "The Billion Ones",
    description: "Triggered global click #1,111,111,111.",
    globalClick: 1111111111,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  250: {
    name: "Jackpot",
    description: "Triggered global click #7,777.",
    globalClick: 7777,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  251: {
    name: "Mega Jackpot",
    description: "Triggered global click #77,777.",
    globalClick: 77777,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  252: {
    name: "Slot Machine God",
    description: "Triggered global click #777,777.",
    globalClick: 777777,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  253: {
    name: "Ultimate Jackpot",
    description: "Triggered global click #7,777,777.",
    globalClick: 7777777,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  254: {
    name: "Eight Sevens",
    description: "Triggered global click #77,777,777.",
    globalClick: 77777777,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  255: {
    name: "Nine Sevens",
    description: "Triggered global click #777,777,777.",
    globalClick: 777777777,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  260: {
    name: "Prosperity",
    description: "Triggered global click #888. Lucky in Chinese culture.",
    globalClick: 888,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  261: {
    name: "Very Lucky",
    description: "Triggered global click #8,888.",
    globalClick: 8888,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  262: {
    name: "Five Eights",
    description: "Triggered global click #88,888.",
    globalClick: 88888,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  263: {
    name: "Fortune",
    description: "Triggered global click #888,888.",
    globalClick: 888888,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  264: {
    name: "Mega Fortune",
    description: "Triggered global click #8,888,888.",
    globalClick: 8888888,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  265: {
    name: "Eight Eights",
    description: "Triggered global click #88,888,888.",
    globalClick: 88888888,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  266: {
    name: "Maximum Prosperity",
    description: "Triggered global click #888,888,888.",
    globalClick: 888888888,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  270: {
    name: "So Close",
    description: "Triggered global click #999.",
    globalClick: 999,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  271: {
    name: "Edge Lord",
    description: "Triggered global click #9,999.",
    globalClick: 9999,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  272: {
    name: "Almost There",
    description: "Triggered global click #99,999.",
    globalClick: 99999,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  273: {
    name: "One Away",
    description: "Triggered global click #999,999.",
    globalClick: 999999,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  274: {
    name: "Agonizing",
    description: "Triggered global click #9,999,999.",
    globalClick: 9999999,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  275: {
    name: "The Tease",
    description: "Triggered global click #99,999,999.",
    globalClick: 99999999,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  276: {
    name: "Billion Minus One",
    description: "Triggered global click #999,999,999.",
    globalClick: 999999999,
    category: "global",
    rarity: "mythic",
    unique: true,
  },

  // --- Palindromes ---
  280: {
    name: "Binary Palindrome",
    description: "Triggered global click #101.",
    globalClick: 101,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  281: {
    name: "Bookends",
    description: "Triggered global click #1,001.",
    globalClick: 1001,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  282: {
    name: "Symmetric",
    description: "Triggered global click #10,001.",
    globalClick: 10001,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  283: {
    name: "Counting Palindrome",
    description: "Triggered global click #12,321.",
    globalClick: 12321,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  284: {
    name: "Mirror Mirror",
    description: "Triggered global click #123,321.",
    globalClick: 123321,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  285: {
    name: "The Mountain",
    description: "Triggered global click #1,234,321.",
    globalClick: 1234321,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  286: {
    name: "Million Sandwich",
    description: "Triggered global click #1,000,001.",
    globalClick: 1000001,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  287: {
    name: "Clean Palindrome",
    description: "Triggered global click #10,000,001.",
    globalClick: 10000001,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  288: {
    name: "Hundred Million Mirror",
    description: "Triggered global click #100,000,001.",
    globalClick: 100000001,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  289: {
    name: "Billion Bookends",
    description: "Triggered global click #1,000,000,001.",
    globalClick: 1000000001,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  290: {
    name: "Perfect Pyramid",
    description: "Triggered global click #12,345,654,321.",
    globalClick: 12345654321,
    category: "global",
    rarity: "mythic",
    unique: true,
  },

  // --- Mathematical / Nerdy ---
  300: {
    name: "Fine Structure",
    description: "Triggered global click #137. The fine structure constant.",
    globalClick: 137,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  301: {
    name: "Pi Day",
    description: "Triggered global click #314. 3.14.",
    globalClick: 314,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  302: {
    name: "Golden",
    description: "Triggered global click #1,618. The golden ratio.",
    globalClick: 1618,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  303: {
    name: "Euler's Click",
    description: "Triggered global click #2,718. Euler's number e.",
    globalClick: 2718,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  304: {
    name: "More Pi",
    description: "Triggered global click #3,141.",
    globalClick: 3141,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  305: {
    name: "Pi Squared",
    description: "Triggered global click #31,415.",
    globalClick: 31415,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  306: {
    name: "Full Pi",
    description: "Triggered global click #314,159.",
    globalClick: 314159,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  307: {
    name: "Pi to Seven",
    description: "Triggered global click #3,141,592.",
    globalClick: 3141592,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  308: {
    name: "Pi Master",
    description: "Triggered global click #31,415,926.",
    globalClick: 31415926,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  309: {
    name: "Pi God",
    description: "Triggered global click #314,159,265.",
    globalClick: 314159265,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  310: {
    name: "Fibonacci",
    description: "Triggered global click #1,123,581,321. 1,1,2,3,5,8,13,21 concatenated.",
    globalClick: 1123581321,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  311: {
    name: "32-bit Max",
    description: "Triggered global click #2,147,483,647. Max signed int32.",
    globalClick: 2147483647,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  312: {
    name: "32-bit Unsigned",
    description: "Triggered global click #4,294,967,295. Max uint32.",
    globalClick: 4294967295,
    category: "global",
    rarity: "mythic",
    unique: true,
  },

  // --- Powers of 2 ---
  320: {
    name: "Byte",
    description: "Triggered global click #256. 2^8.",
    globalClick: 256,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  321: {
    name: "Half K",
    description: "Triggered global click #512. 2^9.",
    globalClick: 512,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  322: {
    name: "Kilobyte",
    description: "Triggered global click #1,024. 2^10.",
    globalClick: 1024,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  323: {
    name: "The Game",
    description: "Triggered global click #2,048. 2^11. You lost.",
    globalClick: 2048,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  324: {
    name: "2^12",
    description: "Triggered global click #4,096.",
    globalClick: 4096,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  325: {
    name: "2^13",
    description: "Triggered global click #8,192.",
    globalClick: 8192,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  326: {
    name: "2^14",
    description: "Triggered global click #16,384.",
    globalClick: 16384,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  327: {
    name: "2^15",
    description: "Triggered global click #32,768.",
    globalClick: 32768,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  328: {
    name: "2^16",
    description: "Triggered global click #65,536.",
    globalClick: 65536,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  329: {
    name: "Megabyte",
    description: "Triggered global click #1,048,576. 2^20.",
    globalClick: 1048576,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  330: {
    name: "Gigabyte",
    description: "Triggered global click #1,073,741,824. 2^30.",
    globalClick: 1073741824,
    category: "global",
    rarity: "mythic",
    unique: true,
  },

  // --- Cultural / Random ---
  340: {
    name: "Not Found",
    description: "Triggered global click #404. Page not found.",
    globalClick: 404,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  341: {
    name: "Server Error",
    description: "Triggered global click #500. Internal server error.",
    globalClick: 500,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  342: {
    name: "Jumbo",
    description: "Triggered global click #747. Boeing 747.",
    globalClick: 747,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  343: {
    name: "Emergency",
    description: "Triggered global click #911.",
    globalClick: 911,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  344: {
    name: "Orwellian",
    description: "Triggered global click #1,984. Big Brother is watching.",
    globalClick: 1984,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  345: {
    name: "Space Odyssey",
    description: "Triggered global click #2,001.",
    globalClick: 2001,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  346: {
    name: "End Times",
    description: "Triggered global click #2,012. The Mayan calendar meme.",
    globalClick: 2012,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  347: {
    name: "Love You 3000",
    description: "Triggered global click #3,000.",
    globalClick: 3000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  348: {
    name: "Jenny",
    description: "Triggered global click #8,675,309. Tommy Tutone's number.",
    globalClick: 8675309,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  349: {
    name: "Seasons of Love",
    description: "Triggered global click #525,600. Minutes in a year.",
    globalClick: 525600,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  350: {
    name: "Seconds in a Day",
    description: "Triggered global click #86,400.",
    globalClick: 86400,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  351: {
    name: "Seconds in a Year",
    description: "Triggered global click #31,536,000.",
    globalClick: 31536000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  352: {
    name: "Upside Down",
    description: "Triggered global click #5,318,008. BOOBIES on a calculator.",
    globalClick: 5318008,
    category: "global",
    rarity: "mythic",
    unique: true,
  },

  // --- Big Round Milestones ---
  360: {
    name: "Five Million",
    description: "Triggered global click #5,000,000.",
    globalClick: 5000000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  361: {
    name: "Quarter Hundred Million",
    description: "Triggered global click #25,000,000.",
    globalClick: 25000000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  362: {
    name: "Three Quarters",
    description: "Triggered global click #75,000,000.",
    globalClick: 75000000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  363: {
    name: "Counting Click",
    description: "Triggered global click #123,456,789.",
    globalClick: 123456789,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  364: {
    name: "Quarter Billion",
    description: "Triggered global click #250,000,000.",
    globalClick: 250000000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  365: {
    name: "Half Billion",
    description: "Triggered global click #500,000,000.",
    globalClick: 500000000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  366: {
    name: "Three Quarter Billion",
    description: "Triggered global click #750,000,000.",
    globalClick: 750000000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  367: {
    name: "Billionaire",
    description: "Triggered global click #1,000,000,000.",
    globalClick: 1000000000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  368: {
    name: "Ten Billion",
    description: "Triggered global click #10,000,000,000.",
    globalClick: 10000000000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  369: {
    name: "Hundred Billion",
    description: "Triggered global click #100,000,000,000.",
    globalClick: 100000000000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },
  370: {
    name: "Trillionaire",
    description: "Triggered global click #1,000,000,000,000. A trillion clicks.",
    globalClick: 1000000000000,
    category: "global",
    rarity: "mythic",
    unique: true,
  },

  // ============================================
  // HIDDEN PERSONAL ACHIEVEMENTS (Editions - Tier 500+)
  // Everyone can earn these based on their personal click count
  // ============================================
  500: {
    name: "Nice (Personal)",
    description: "Your 69th click. Nice.",
    hiddenClick: 69,
    category: "hidden",
    rarity: "uncommon",
  },
  501: {
    name: "Blaze It (Personal)",
    description: "Your 420th click.",
    hiddenClick: 420,
    category: "hidden",
    rarity: "uncommon",
  },
  502: {
    name: "Devil's Click (Personal)",
    description: "Your 666th click. Devilish.",
    hiddenClick: 666,
    category: "hidden",
    rarity: "rare",
  },
  503: {
    name: "Lucky 7s (Personal)",
    description: "Your 777th click. Triple lucky!",
    hiddenClick: 777,
    category: "hidden",
    rarity: "rare",
  },
  504: {
    name: "Elite (Personal)",
    description: "Your 1,337th click. Leet.",
    hiddenClick: 1337,
    category: "hidden",
    rarity: "rare",
  },
  505: {
    name: "Palindrome",
    description: "Your 12,321st click. Reads the same forwards and backwards.",
    hiddenClick: 12321,
    category: "hidden",
    rarity: "rare",
  },
  506: {
    name: "Calculator (Personal)",
    description: "Your 8,008th click. BOOB.",
    hiddenClick: 8008,
    category: "hidden",
    rarity: "rare",
  },
  507: {
    name: "Perfect Combo",
    description: "Your 42,069th click. Nice + 42.",
    hiddenClick: 42069,
    category: "hidden",
    rarity: "epic",
  },
  508: {
    name: "Ultra Nice (Personal)",
    description: "Your 69,420th click.",
    hiddenClick: 69420,
    category: "hidden",
    rarity: "epic",
  },
};

// Image URLs - replace with actual hosted images
const IMAGE_BASE_URL = "https://mann.cool/clickstr/nft/images";

/**
 * Build ERC1155 compliant metadata JSON
 */
function buildMetadata(tokenId) {
  const meta = TOKEN_METADATA[tokenId];

  if (!meta) {
    return null;
  }

  // Build attributes array
  const attributes = [
    { trait_type: "Category", value: meta.category },
    { trait_type: "Rarity", value: meta.rarity },
  ];

  if (meta.clicks) {
    attributes.push({ trait_type: "Clicks Required", value: meta.clicks, display_type: "number" });
  }
  if (meta.streak) {
    attributes.push({ trait_type: "Streak Days", value: meta.streak, display_type: "number" });
  }
  if (meta.epoch) {
    attributes.push({ trait_type: "Epoch", value: String(meta.epoch) });
  }
  if (meta.globalClick) {
    attributes.push({ trait_type: "Global Click", value: meta.globalClick, display_type: "number" });
  }
  if (meta.hiddenClick) {
    attributes.push({ trait_type: "Personal Click", value: meta.hiddenClick, display_type: "number" });
  }
  if (meta.unique) {
    attributes.push({ trait_type: "Edition", value: "1/1" });
  } else {
    attributes.push({ trait_type: "Edition", value: "Open" });
  }

  // ERC1155 Metadata JSON format
  return {
    name: meta.name,
    description: meta.description,
    image: `${IMAGE_BASE_URL}/${tokenId}.png`,
    external_url: `https://mann.cool/clickstr/nft/${tokenId}`,
    attributes,
    // ERC1155 specific - properties is optional but useful
    properties: {
      tier: tokenId,
      category: meta.category,
      rarity: meta.rarity,
      unique: meta.unique || false,
    },
  };
}

/**
 * Main handler
 *
 * Route: GET /api/clickstr/nft/[tokenId]
 * or:    GET /api/clickstr/nft/:tokenId
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get token ID from URL path
  // Vercel: req.query.tokenId
  // Express: req.params.tokenId
  const tokenId = parseInt(req.query.tokenId || req.params?.tokenId);

  if (isNaN(tokenId) || tokenId <= 0) {
    return res.status(400).json({ error: "Invalid token ID" });
  }

  const metadata = buildMetadata(tokenId);

  if (!metadata) {
    // ERC1155 standard: return metadata even for non-existent tokens
    // But we can return a 404 for completely invalid tier numbers
    return res.status(404).json({
      error: "Token not found",
      message: `No metadata defined for token ID ${tokenId}`,
    });
  }

  // Set cache headers for efficiency
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  res.setHeader("Content-Type", "application/json");

  return res.status(200).json(metadata);
}

// Export metadata for use by claim-signature API
export { TOKEN_METADATA };
