export const tripFaqCategories = [
  { field: 'faqs', heading: 'General Questions' },
  { field: 'bestTimeToTrekFaqs', heading: 'Best Time To Trek' },
  { field: 'requiredPermitsFaqs', heading: 'Required Permits For The Trek' },
  { field: 'trekkerSafetyFaqs', heading: "Trekker's Safety and Well-Being" },
  { field: 'packingListFaqs', heading: 'Packing List' },
  { field: 'altitudeSicknessFaqs', heading: 'Altitude Sickness' },
  { field: 'accommodationFaqs', heading: 'Accommodation During The Trek' },
] as const

export type TripFaqCategoryField = (typeof tripFaqCategories)[number]['field']

export type TripFaqItem = {
  id?: string | null
  question?: string | null
  answer?: string | null
}

export type TripFaqData = Partial<Record<TripFaqCategoryField, TripFaqItem[] | null>>

/** Keep category order and labels consistent between the CMS and rendered trip pages. */
export function getTripFaqGroups(trip: TripFaqData) {
  return tripFaqCategories
    .map(({ field, heading }) => ({
      field,
      heading,
      faqs: (trip[field] ?? []).filter(
        (faq): faq is TripFaqItem & { question: string } => Boolean(faq?.question?.trim()),
      ),
    }))
    .filter(({ faqs }) => faqs.length > 0)
}
