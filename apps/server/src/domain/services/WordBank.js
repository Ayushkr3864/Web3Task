const DEFAULT_WORDS = [
  "blockchain",
  "wallet",
  "token",
  "rocket",
  "penguin",
  "mountain",
  "pizza",
  "guitar",
  "castle",
  "rainbow",
  "robot",
  "volcano",
  "bicycle",
  "elephant",
  "wizard",
  "treasure",
  "island",
  "satellite",
  "tornado",
  "campfire",
];

export class WordBank {
  constructor(words = DEFAULT_WORDS) {
    this.words = words;
  }

  getRandomOptions(count) {
    const pool = [...this.words];
    const options = [];

    while (pool.length > 0 && options.length < count) {
      const index = Math.floor(Math.random() * pool.length);
      options.push(pool.splice(index, 1)[0]);
    }

    return options;
  }
}
