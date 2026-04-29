const fs = require('fs');

const rawGeo = {
  countries: ["IN"],
  cities: [
    { key: "123456", name: "Indore" },
    { key: "654321", name: "Hyderabad" }
  ],
  location_types: ["home", "recent"]
};

const cleanGeo = { location_types: rawGeo.location_types || ["home", "recent"] };
let hasLocation = false;

if (rawGeo.countries && rawGeo.countries.length > 0) { 
  cleanGeo.countries = rawGeo.countries; 
  hasLocation = true; 
}
if (rawGeo.cities && rawGeo.cities.length > 0) { 
  cleanGeo.cities = rawGeo.cities.map(c => ({ key: String(c.key), radius: 25, distance_unit: "mile" })); 
  hasLocation = true; 
}
if (rawGeo.regions && rawGeo.regions.length > 0) { 
  cleanGeo.regions = rawGeo.regions.map(c => ({ key: String(c.key) })); 
  hasLocation = true; 
}

console.log(JSON.stringify(cleanGeo, null, 2));
