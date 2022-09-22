import axios from 'axios';
import { JSDOM } from 'jsdom';
import { AvailableLanguage } from '../types/AvailableLanguages';

/**
 * Gets a random word to place
 * @param language The language of the word to place 
 * @returns A word
 */
export default async function getWord(language: AvailableLanguage): Promise<string> {
	if (language === 'fr' || language === 'en') {
		const url = language === 'fr'
			? 'https://www.palabrasaleatorias.com/mots-aleatoires.php'
			: 'https://www.palabrasaleatorias.com/random-words.php';
		const res = await axios.get(url);
		const dom = new JSDOM(res.data);
		const wordElm = dom.window.document.querySelector('table tbody tr td div') as HTMLDivElement;
		const word = wordElm.innerHTML.trim();
		if (word.includes(' ') || word.length < 3)
			return getWord(language);
		return word.toLowerCase();
	}
	if (language === 'ko') {
		const res = await axios.get('https://www.generatormix.com/random-korean-words-generator?number=1');
		const dom = new JSDOM(res.data);
		const wordElm = dom.window.document.querySelector('#output h3.text-center') as HTMLDivElement;
		const word = wordElm.innerHTML.trim();
		// We avoid words ending with ~다 as they may be dictionary forms of verbs
		// which is not the most fun to play with.
		if (word.includes(' ') || word.endsWith('다'))
			return getWord(language);
		return word;
	}
	return 'rick astley'; // TypeScript is unhappy without a return here.
}

