/**
 * Frontend-only EN/DE/FR language guardrails.
 *
 * These tests make sure the cookie model, typed dictionaries and English
 * fallback behave without touching Payload locales, URLs or the database.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  frontendHtmlLang,
  frontendLocaleMeta,
  frontendLocales,
  frontendOgLocale,
  isFrontendLocale,
  locales,
  sitePath,
} from '../i18n/config'
import {
  blogCategoryLabel,
  blogCategoryLabelForDictionary,
  dictionary,
  getDictionary,
} from '../i18n/dictionaries'
import { getFrontendLocaleFromCookie } from '../i18n/frontend-locale'
import { clearTranslationCache, loadTranslations } from '../i18n/load-translations'
import { translateString } from '../i18n/translate'
import { translations as de } from '../i18n/translations/de'
import { translations as fr } from '../i18n/translations/fr'

test('Payload remains single-locale and frontend URLs stay unprefixed', () => {
  assert.deepEqual(locales, ['en'])
  assert.deepEqual(frontendLocales, ['en', 'de', 'fr'])
  assert.equal(sitePath('trips'), '/trips')
  assert.equal(isFrontendLocale('de'), true)
  assert.equal(isFrontendLocale('es'), false)
  assert.equal(frontendHtmlLang('de'), 'de')
  assert.equal(frontendOgLocale('fr'), 'fr_FR')
  assert.equal(frontendLocaleMeta.de.languageLabel, 'Sprache')
  assert.equal(frontendLocaleMeta.fr.languageLabel, 'Langue')
})

test('the frontend locale cookie is validated and defaults to English', () => {
  assert.equal(getFrontendLocaleFromCookie(''), 'en')
  assert.equal(getFrontendLocaleFromCookie('foo=bar; hg_frontend_locale=de; other=1'), 'de')
  assert.equal(getFrontendLocaleFromCookie('hg_frontend_locale=fr'), 'fr')
  assert.equal(getFrontendLocaleFromCookie('hg_frontend_locale=xx'), 'en')
  assert.equal(getFrontendLocaleFromCookie('hg_frontend_locale=%7Bbad%7D'), 'en')
})

test('DE and FR UI dictionaries change copy and keep interpolation placeholders', () => {
  assert.equal(getDictionary('en'), dictionary)
  assert.equal(getDictionary('de').nav.home, 'Startseite')
  assert.equal(getDictionary('fr').nav.home, 'Accueil')
  assert.equal(getDictionary('de').common.language, 'Sprache')
  assert.equal(getDictionary('fr').common.language, 'Langue')
  assert.equal(getDictionary('de').trips.resultCount_other, '{count} Reisen')
  assert.equal(getDictionary('fr').trips.resultCount_other, '{count} voyages')
  assert.equal(getDictionary('de').footer.copyright, '© {year} {site}. Alle Rechte vorbehalten.')
  assert.equal(getDictionary('fr').footer.copyright, '© {year} {site}. Tous droits réservés.')
  assert.match(getDictionary('de').cta.heading, /Bereit/)
  assert.match(getDictionary('fr').cta.heading, /Prêt/)
  assert.notEqual(
    blogCategoryLabelForDictionary('health-safety', getDictionary('de')),
    blogCategoryLabel('health-safety'),
  )
})

test('translation lookup changes static, dynamic and branded copy with English fallback', () => {
  assert.equal(translateString('Read more', 'de', de), 'Mehr lesen')
  assert.equal(translateString('Read more', 'fr', fr), 'En savoir plus')
  assert.equal(translateString('  Plan your trip  ', 'de', de), '  Planen Sie Ihre Reise  ')
  assert.equal(translateString('Read more · Hike Globally', 'de', de), 'Mehr lesen · Hike Globally')
  assert.equal(translateString('Hike Globally', 'de', de), 'Hike Globally')
  assert.equal(translateString('Hike Globally', 'fr', fr), 'Hike Globally')
  assert.equal(translateString('{count} trips', 'de', de), '{count} Reisen')
  assert.equal(translateString('{count} trips', 'fr', fr), '{count} voyages')
  assert.equal(translateString('3 trips', 'de', de), '3 Reisen')
  assert.equal(translateString('3 trips', 'fr', fr), '3 voyages')
  assert.equal(translateString('1 trip', 'de', de), '1 Reise')
  assert.equal(translateString('12 min read', 'de', de), '12 Min. Lesezeit')
  assert.equal(translateString('12 min read', 'fr', fr), '12 min de lecture')
  assert.equal(
    translateString('© 2026 Hike Globally. All rights reserved.', 'de', de),
    '© 2026 Hike Globally. Alle Rechte vorbehalten.',
  )
  assert.equal(
    translateString('© 2026 Hike Globally. All rights reserved.', 'fr', fr),
    '© 2026 Hike Globally. Tous droits réservés.',
  )
  assert.equal(translateString('Ready to walk where the', 'de', de), 'Bereit, dorthin zu gehen, wo die')
  assert.equal(translateString('map runs out of names?', 'fr', fr), 'carte manque de noms ?')
  assert.equal(
    translateString('A brand new CMS sentence.', 'de', de),
    'A brand new CMS sentence.',
  )
  assert.equal(translateString('Read more', 'en', de), 'Read more')
})

test('DE/FR dictionaries load lazily from the frontend-only translation files', async () => {
  clearTranslationCache()
  const loadedDe = await loadTranslations('de')
  const loadedFr = await loadTranslations('fr')
  assert.equal(loadedDe['Read more'], 'Mehr lesen')
  assert.equal(loadedFr['Read more'], 'En savoir plus')
  assert.deepEqual(await loadTranslations('en'), {})
  clearTranslationCache()
})
