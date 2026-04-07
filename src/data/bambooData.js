export const bambooMenu = [
  { category: 'Champagne', items: [
    { name: 'Moet & Chandon Reserve Imperial', price: 150, passPrice: 180 },
    { name: 'Clicquot Brut', price: 160, passPrice: 190 },
    { name: 'Moet & Chandon N.I.R. Rosè', price: 200, passPrice: 220 },
    { name: 'Moet & Chandon ICE Imperial', price: 200, passPrice: 220 },
    { name: 'R di Ruinart', price: 170, passPrice: 200 },
    { name: 'Ruinart Blanc de Blanc', price: 220, passPrice: 250 },
    { name: 'Ruinart Rosè', price: 220, passPrice: 250 },
    { name: 'Perrier Jouet Grand Brut', price: 170, passPrice: 200 },
    { name: 'Perrier Jouet Blason Rosè', price: 200, passPrice: 220 },
    { name: 'Perrier Jouet Belle Epoque', price: 500, passPrice: 550 },
    { name: 'Dom Perignon Vintage', price: 500, passPrice: 550 },
    { name: 'Dom Perignon Vintage Fluo', price: 550, passPrice: 600, inventory_count: 0 },
    { name: 'Dom Perignon Vintage Rosè', price: 700, passPrice: 750 },
    { name: 'Cristal Brut', price: 600, passPrice: 650 },
    { name: 'Cristal Brut Rosè', price: 800, passPrice: 850 },
    { name: 'Krug Grande Cuvée', price: 600, passPrice: 650 },
    { name: 'Armand De Brignac Brut Gold', price: 700, passPrice: 750 },
    { name: 'Magnum Moet Imperial', price: 350, passPrice: 400 },
    { name: 'Magnum Moet N.I.R. Rosè', price: 500, passPrice: 550 },
    { name: 'Magnum Moet ICE Imperial', price: 500, passPrice: 550 },
    { name: 'Magnum Dom Perignon Vintage', price: 1500, passPrice: 1550 },
    { name: 'Moet Imperial 3L', price: 800, passPrice: 850 },
    { name: 'Moet N.I.R. Rosè 3L', price: 1500, passPrice: 1550 }
  ]},
  { category: 'Vodka', items: [
    { name: 'Grey Goose', price: 150, passPrice: 180 },
    { name: 'Grey Goose Altius', price: 350, passPrice: 400 },
    { name: 'Au fruttati', price: 150, passPrice: 180 },
    { name: 'Magnum Grey Goose', price: 400, passPrice: 450 },
    { name: 'Grey Goose 3L', price: 750, passPrice: 800 },
    { name: 'Grey Goose 6L', price: 1500, passPrice: 1700 }
  ]},
  { category: 'Tequila', items: [
    { name: 'Patron Silver', price: 160, passPrice: 180 },
    { name: 'Patron Anejo', price: 160, passPrice: 180 },
    { name: 'Patron Reposado', price: 160, passPrice: 180 },
    { name: 'Patron "El Alto"', price: 500, passPrice: 550 },
    { name: 'Tequiero Reposado', price: 180, passPrice: 200 },
    { name: 'Don Julio Reposado', price: 200, passPrice: 230 },
    { name: 'Don Julio 1942', price: 550, passPrice: 600 },
    { name: 'Clase Azul Plata', price: 500, passPrice: 550 },
    { name: 'Clase Azul Reposado', price: 600, passPrice: 650 },
    { name: 'Clase Azul Durango', price: 1500, passPrice: 1550 }
  ]},
  { category: 'Rum', items: [
    { name: 'Havana Club 7Y', price: 150, passPrice: 180 },
    { name: 'Santa Teresa', price: 170, passPrice: 200 },
    { name: 'Zacapa 23', price: 200, passPrice: 220 },
    { name: 'Barcelo Imperial', price: 200, passPrice: 220 },
    { name: 'Brugal Leyenda', price: 220, passPrice: 250 }
  ]},
  { category: 'Gin', items: [
    { name: 'Bombay Premiere Cru', price: 150, passPrice: 180 },
    { name: 'Mare', price: 160, passPrice: 180 },
    { name: 'Hendrick\'s', price: 160, passPrice: 180 },
    { name: 'Barbarasa', price: 150, passPrice: 180 }
  ]},
  { category: 'Whisky & Cognac', items: [
    { name: 'Jack Daniel\'s Tennessee', price: 150, passPrice: 180 },
    { name: 'Fireball', price: 150, passPrice: 180 },
    { name: 'Aberfeldy 12 YO', price: 180, passPrice: 200 },
    { name: 'Jhonnie Walker Black Label', price: 180, passPrice: 200 },
    { name: 'Jhonnie Walker Gold Label', price: 220, passPrice: 250 },
    { name: 'Hennessy', price: 170, passPrice: 200 }
  ]}
];

// Tables definitions and their Minimum Spends
export const bambooTables = [
  ...[101, 102, 103, 104, 105, 106, 107, 108, 109, 110].map(id => ({ id, name: `Dance Floor ${id}`, type: 'dancefloor', minSpend: 360 })),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(id => ({ id, name: `Privè ${id}`, type: 'prive', minSpend: 1000 })),
  ...[11, 12, 13, 14].map(id => ({ id, name: `Console VIP ${id}`, type: 'console', minSpend: 2000 })),
];
