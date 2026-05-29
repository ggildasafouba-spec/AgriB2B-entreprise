/**
 * Calendrier agricole du Cameroun
 * Indique les mois de disponibilité par produit/catégorie et par région
 */
export const CAMEROON_SEASONS = [
  // Légumes
  { product: 'Tomates', category: 'Légumes', months: [1,2,3,10,11,12], regions: ['Ouest', 'Nord-Ouest', 'Centre'] },
  { product: 'Oignons', category: 'Légumes', months: [1,2,3,4,11,12], regions: ['Extrême-Nord', 'Nord'] },
  { product: 'Poivrons', category: 'Légumes', months: [1,2,3,4,10,11,12], regions: ['Ouest', 'Sud-Ouest'] },
  { product: 'Carottes', category: 'Légumes', months: [1,2,3,4,5,10,11,12], regions: ['Ouest', 'Nord-Ouest'] },
  { product: 'Choux', category: 'Légumes', months: [1,2,3,4,5,6,10,11,12], regions: ['Ouest', 'Nord-Ouest'] },
  { product: 'Laitue', category: 'Légumes', months: [1,2,3,4,5,6,7,8,9,10,11,12], regions: ['Centre', 'Littoral'] },
  { product: 'Gombo', category: 'Légumes', months: [5,6,7,8,9,10], regions: ['Centre', 'Nord', 'Adamaoua'] },

  // Fruits
  { product: 'Mangues', category: 'Fruits', months: [3,4,5,6], regions: ['Nord', 'Extrême-Nord', 'Adamaoua'] },
  { product: 'Avocats', category: 'Fruits', months: [3,4,5,6,7,8], regions: ['Ouest', 'Centre', 'Sud'] },
  { product: 'Ananas', category: 'Fruits', months: [1,2,3,4,5,6,7,8,9,10,11,12], regions: ['Littoral', 'Centre'] },
  { product: 'Bananes plantain', category: 'Fruits', months: [1,2,3,4,5,6,7,8,9,10,11,12], regions: ['Sud-Ouest', 'Littoral', 'Centre'] },
  { product: 'Papayes', category: 'Fruits', months: [1,2,3,4,5,6,7,8,9,10,11,12], regions: ['Littoral', 'Centre', 'Sud'] },
  { product: 'Oranges', category: 'Fruits', months: [11,12,1,2,3], regions: ['Ouest', 'Nord-Ouest'] },
  { product: 'Pastèques', category: 'Fruits', months: [1,2,3,4,11,12], regions: ['Nord', 'Extrême-Nord', 'Centre'] },

  // Céréales
  { product: 'Maïs', category: 'Céréales', months: [7,8,9,10], regions: ['Ouest', 'Nord-Ouest', 'Centre', 'Nord'] },
  { product: 'Riz', category: 'Céréales', months: [10,11,12,1], regions: ['Extrême-Nord', 'Nord', 'Nord-Ouest'] },
  { product: 'Sorgho', category: 'Céréales', months: [10,11,12], regions: ['Nord', 'Extrême-Nord', 'Adamaoua'] },
  { product: 'Mil', category: 'Céréales', months: [9,10,11], regions: ['Extrême-Nord', 'Nord'] },

  // Tubercules
  { product: 'Manioc', category: 'Tubercules', months: [1,2,3,4,5,6,7,8,9,10,11,12], regions: ['Centre', 'Sud', 'Est'] },
  { product: 'Ignames', category: 'Tubercules', months: [7,8,9,10,11], regions: ['Ouest', 'Centre', 'Adamaoua'] },
  { product: 'Macabo/Taro', category: 'Tubercules', months: [1,2,3,4,5,6,7,8,9,10,11,12], regions: ['Centre', 'Sud', 'Littoral'] },
  { product: 'Patates douces', category: 'Tubercules', months: [6,7,8,9,10,11], regions: ['Ouest', 'Nord-Ouest', 'Adamaoua'] },
  { product: 'Pommes de terre', category: 'Tubercules', months: [3,4,5,9,10,11], regions: ['Ouest', 'Nord-Ouest'] },

  // Légumineuses
  { product: 'Haricots', category: 'Légumineuses', months: [7,8,9,10,11], regions: ['Ouest', 'Nord-Ouest', 'Adamaoua'] },
  { product: 'Arachides', category: 'Légumineuses', months: [8,9,10,11], regions: ['Nord', 'Adamaoua', 'Centre'] },
  { product: 'Soja', category: 'Légumineuses', months: [9,10,11], regions: ['Nord', 'Adamaoua'] },

  // Cultures de rente
  { product: 'Cacao', category: 'Autre', months: [9,10,11,12], regions: ['Centre', 'Sud', 'Sud-Ouest'] },
  { product: 'Café', category: 'Autre', months: [10,11,12,1], regions: ['Ouest', 'Nord-Ouest', 'Sud-Ouest'] },
  { product: 'Poivre de Penja', category: 'Épices', months: [1,2,3,4,5,6,7,8,9,10,11,12], regions: ['Littoral'] },
];

export const MONTH_NAMES_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export function getSeasonalProducts(month?: number, region?: string) {
  const currentMonth = month || new Date().getMonth() + 1;
  return CAMEROON_SEASONS.filter(s => {
    const inSeason = s.months.includes(currentMonth);
    const inRegion = !region || s.regions.includes(region);
    return inSeason && inRegion;
  });
}
