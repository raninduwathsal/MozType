import { TestModifiers, QuoteLength } from '../types';
import { getQuoteByLength } from './quotes-data';

export const ENGLISH_TOP_WORDS: string[] = [
  "the", "be", "of", "and", "a", "to", "in", "he", "have", "it",
  "that", "for", "they", "with", "as", "not", "on", "she", "at", "by",
  "this", "we", "you", "do", "but", "his", "from", "they", "say", "her",
  "she", "or", "an", "will", "my", "one", "all", "would", "there", "their",
  "what", "so", "up", "out", "if", "about", "who", "get", "which", "go",
  "me", "when", "make", "can", "like", "time", "no", "just", "him", "know",
  "take", "people", "into", "year", "your", "good", "some", "could", "them", "see",
  "other", "than", "then", "now", "look", "only", "come", "its", "over", "think",
  "also", "back", "after", "use", "two", "how", "our", "work", "first", "well",
  "way", "even", "new", "want", "because", "any", "these", "give", "day", "most",
  "us", "great", "between", "need", "large", "under", "might", "never", "same", "another",
  "begin", "while", "last", "might", "next", "sound", "below", "something", "thought", "both",
  "few", "those", "always", "show", "large", "often", "together", "ask", "house", "world",
  "going", "hand", "system", "life", "tell", "water", "call", "become", "here", "high",
  "every", "found", "still", "point", "answer", "study", "school", "father", "mother", "night",
  "small", "place", "head", "change", "play", "spell", "air", "away", "animal", "house",
  "point", "page", "letter", "mother", "answer", "found", "study", "still", "learn", "should",
  "america", "world", "high", "every", "near", "add", "food", "between", "own", "below",
  "country", "plant", "last", "school", "father", "keep", "tree", "never", "start", "city",
  "earth", "eye", "light", "thought", "head", "under", "story", "saw", "left", "don't",
  "few", "while", "along", "might", "close", "something", "seem", "next", "hard", "open",
  "example", "begin", "life", "always", "those", "both", "paper", "together", "got", "group",
  "often", "run", "important", "until", "children", "side", "feet", "car", "mile", "night",
  "walk", "white", "sea", "began", "grow", "took", "river", "four", "carry", "state",
  "once", "book", "hear", "stop", "without", "second", "late", "miss", "idea", "enough",
  "eat", "face", "watch", "far", "indian", "real", "almost", "let", "above", "girl",
  "sometimes", "mountain", "cut", "young", "talk", "soon", "list", "song", "being", "leave",
  "family", "it's", "body", "music", "color", "stand", "sun", "questions", "fish", "area",
  "mark", "dog", "horse", "birds", "problem", "complete", "room", "knew", "since", "ever",
  "piece", "told", "usually", "didn't", "friends", "easy", "heard", "order", "red", "door",
  "sure", "become", "top", "ship", "across", "today", "during", "short", "better", "best",
  "however", "low", "hours", "black", "products", "happened", "whole", "measure", "remember", "early",
  "waves", "reached", "listen", "wind", "rock", "space", "covered", "fast", "several", "hold",
  "himself", "toward", "five", "step", "morning", "passed", "vowel", "true", "hundred", "against",
  "pattern", "numeral", "table", "north", "slowly", "money", "map", "farm", "pulled", "draw",
  "voice", "seen", "cold", "cried", "plan", "notice", "south", "sing", "war", "ground",
  "fall", "king", "town", "unit", "figure", "certain", "field", "travel", "wood", "fire",
  "upon", "done", "english", "road", "halt", "ten", "fly", "gave", "box", "finally",
  "wait", "correct", "oh", "quickly", "person", "became", "shown", "minutes", "strong", "verb",
  "stars", "front", "feel", "fact", "inches", "street", "decided", "contain", "course", "surface",
  "produce", "building", "ocean", "class", "note", "nothing", "rest", "carefully", "scientists", "inside",
  "wheels", "stay", "green", "known", "island", "week", "less", "machine", "base", "ago",
  "stood", "plane", "system", "behind", "ran", "round", "boat", "game", "force", "brought",
  "understand", "warm", "common", "bring", "explain", "dry", "though", "language", "shape", "deep",
  "thousands", "yes", "clear", "equation", "yet", "government", "filled", "heat", "full", "hot",
  "check", "object", "am", "rule", "among", "noun", "power", "cannot", "able", "six",
  "size", "dark", "ball", "material", "special", "heavy", "fine", "pair", "circle", "include",
  "built", "can't", "matter", "square", "syllables", "perhaps", "bill", "felt", "suddenly", "test",
  "direction", "center", "farmers", "ready", "anything", "divided", "general", "energy", "subject", "europe",
  "moon", "region", "return", "believe", "dance", "members", "picked", "simple", "cells", "paint",
  "mind", "love", "cause", "rain", "exercise", "eggs", "train", "blue", "wish", "drop",
  "developed", "window", "difference", "distance", "heart", "site", "sum", "summer", "wall", "forest",
  "probably", "legs", "sat", "main", "winter", "wide", "written", "length", "reason", "kept",
  "interest", "arms", "brother", "race", "present", "beautiful", "store", "job", "edge", "past",
  "sign", "record", "finished", "discovered", "wild", "happy", "beside", "gone", "sky", "grass",
  "million", "west", "lay", "weather", "root", "instruments", "meet", "third", "months", "paragraph",
  "raised", "represent", "soft", "whether", "clothes", "flowers", "shall", "drive", "brother", "quiet"
];

export class WordsGenerator {
  private words: string[] = [];
  private modifiers: TestModifiers;
  private capitalizeNext: boolean = true;
  private quoteMetadata?: { author: string; source?: string };

  constructor(modifiers: TestModifiers) {
    this.modifiers = modifiers;
  }

  public setModifiers(modifiers: TestModifiers) {
    this.modifiers = modifiers;
  }

  public getQuoteMetadata() {
    return this.quoteMetadata;
  }

  /**
   * Generates initial words for Words mode or Time mode
   */
  public generateWords(count: number = 50): string[] {
    this.words = [];
    this.capitalizeNext = true;
    this.addMoreWords(count);

    if (this.modifiers.reverseOrder) {
      this.words.reverse();
    }
    return this.words;
  }

  /**
   * Dynamically appends more words as the user approaches the end of the buffer
   */
  public addMoreWords(count: number = 30): string[] {
    const newWords: string[] = [];
    for (let i = 0; i < count; i++) {
      let word = this.getRandomWord();

      if (this.modifiers.numbers && Math.random() < 0.12) {
        word = this.generateRandomNumber();
      }

      if (this.modifiers.punctuation) {
        word = this.applyPunctuation(word);
      }

      newWords.push(word);
      this.words.push(word);
    }
    return newWords;
  }

  /**
   * Generates a quote test
   */
  public generateQuote(length: QuoteLength = 'medium'): string[] {
    const quote = getQuoteByLength(length);
    this.quoteMetadata = {
      author: quote.author,
      source: quote.source
    };
    // Split by whitespace
    this.words = quote.text.trim().split(/\s+/);
    if (this.modifiers.reverseOrder) {
      this.words.reverse();
    }
    return this.words;
  }

  /**
   * Generates custom mode words
   */
  public generateCustom(text: string): string[] {
    this.quoteMetadata = undefined;
    const cleanText = text.trim();
    if (!cleanText) {
      return this.generateWords(30);
    }
    this.words = cleanText.split(/\s+/);
    return this.words;
  }

  /**
   * Generates zen mode starting buffer
   */
  public generateZen(): string[] {
    this.quoteMetadata = undefined;
    this.words = [];
    return this.generateWords(40);
  }

  private getRandomWord(): string {
    const idx = Math.floor(Math.random() * ENGLISH_TOP_WORDS.length);
    return ENGLISH_TOP_WORDS[idx];
  }

  private generateRandomNumber(): string {
    const roll = Math.random();
    if (roll < 0.4) {
      return Math.floor(Math.random() * 100).toString();
    } else if (roll < 0.7) {
      return (1950 + Math.floor(Math.random() * 80)).toString(); // years
    } else {
      return Math.floor(Math.random() * 1000).toString();
    }
  }

  private applyPunctuation(word: string): string {
    let formatted = word;

    // Apply capitalization if needed (start of sentence)
    if (this.capitalizeNext) {
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
      this.capitalizeNext = false;
    }

    // Punctuation injection with realistic frequency
    const roll = Math.random();
    if (roll < 0.10) {
      // Period ends sentence
      formatted += '.';
      this.capitalizeNext = true;
    } else if (roll < 0.16) {
      // Comma pause
      formatted += ',';
    } else if (roll < 0.19) {
      // Question mark
      formatted += '?';
      this.capitalizeNext = true;
    } else if (roll < 0.22) {
      // Exclamation mark
      formatted += '!';
      this.capitalizeNext = true;
    } else if (roll < 0.25) {
      // Semicolon or colon
      formatted += Math.random() > 0.5 ? ';' : ':';
    } else if (roll < 0.28) {
      // Quotes around word
      formatted = `"${formatted}"`;
    }

    return formatted;
  }
}
