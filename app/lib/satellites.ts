// The story of the two fire-watching instruments: MODIS (2000 – ~2027) and VIIRS (2011 – today).

export type Milestone = { date: string; year: number; who: 'MODIS' | 'VIIRS' | 'Both'; title: string; text: string }

export const MILESTONES: Milestone[] = [
  { year: 1999, date: '18 Dec 1999', who: 'MODIS', title: 'Terra launches', text: 'NASA launches the Terra satellite carrying the first MODIS instrument. It crosses the equator at about 10:30 in the morning and 10:30 at night.' },
  { year: 2000, date: 'Feb – Nov 2000', who: 'MODIS', title: 'MODIS opens its eyes', text: "Terra MODIS takes its first pictures of Earth in February 2000. From November 2000 NASA's fire record starts: every fire hotter than its surroundings is logged as a 1 km \"hot pixel\"." },
  { year: 2002, date: '4 May 2002', who: 'MODIS', title: 'Aqua launches', text: 'A second MODIS goes up on the Aqua satellite. It passes over in the early afternoon (13:30), when fires burn strongest, so together Terra and Aqua see most places 4 times a day.' },
  { year: 2007, date: '2007', who: 'MODIS', title: 'FIRMS is born', text: 'The University of Maryland and NASA start FIRMS (Fire Information for Resource Management System), which emails fire alerts to forest managers, especially in Africa.' },
  { year: 2010, date: '2010', who: 'MODIS', title: 'Watching the Amazon and Russia burn', text: 'MODIS fire data helps track the 2010 Russian heatwave fires and the Amazon drought fires.' },
  { year: 2011, date: '28 Oct 2011', who: 'VIIRS', title: 'Suomi NPP launches with VIIRS', text: 'The first VIIRS instrument launches. It sees 375 m pixels for fires, about 7 times smaller in area than MODIS, so it can spot much smaller fires.' },
  { year: 2012, date: 'Jan 2012', who: 'VIIRS', title: 'VIIRS fire record begins', text: 'The 375 m VIIRS active-fire product starts. FIRMS moves to NASA and starts delivering fire data within about 3 hours of a satellite pass.' },
  { year: 2017, date: '18 Nov 2017', who: 'VIIRS', title: 'NOAA-20 launches', text: 'The second VIIRS goes up on NOAA-20 (JPSS-1), flying half an orbit behind Suomi NPP.' },
  { year: 2019, date: '2019 – 2020', who: 'Both', title: 'Black Summer and the Amazon', text: "Both satellites track Australia's Black Summer bushfires and the 2019 Amazon fires, which made news around the world." },
  { year: 2020, date: '2020 onwards', who: 'MODIS', title: 'Terra and Aqua start drifting', text: 'Terra and Aqua run low on fuel and stop correcting their orbits. Their crossing times slowly drift, which changes how they see fires.' },
  { year: 2022, date: '10 Nov 2022', who: 'VIIRS', title: 'NOAA-21 launches', text: 'The third VIIRS launches on NOAA-21 (JPSS-2). This app shows its fire detections on the Hotspot Map.' },
  { year: 2023, date: '2023', who: 'Both', title: "Canada's record fire season", text: 'MODIS and VIIRS record the largest area burned in Canada in modern history; smoke reaches New York and Europe.' },
  { year: 2026, date: 'Late 2026 – early 2027', who: 'MODIS', title: 'MODIS says goodbye', text: 'NASA expects Terra and Aqua to begin shutting down in late 2026 or early 2027 and asks scientists to switch to VIIRS, which continues the 25-year fire record.' },
]

export const COMPARISON: { feature: string; modis: string; viirs: string }[] = [
  { feature: 'Full name', modis: 'Moderate Resolution Imaging Spectroradiometer', viirs: 'Visible Infrared Imaging Radiometer Suite' },
  { feature: 'Satellites', modis: 'Terra (1999) and Aqua (2002)', viirs: 'Suomi NPP (2011), NOAA-20 (2017), NOAA-21 (2022)' },
  { feature: 'Built by', modis: 'NASA', viirs: 'NASA and NOAA' },
  { feature: 'Colour bands', modis: '36', viirs: '22' },
  { feature: 'Fire pixel size', modis: '1 km × 1 km', viirs: '375 m × 375 m' },
  { feature: 'Width of each image strip', modis: '2,330 km', viirs: '3,060 km (no gaps at the equator)' },
  { feature: 'Fire record starts', modis: 'November 2000', viirs: 'January 2012' },
  { feature: 'Height above Earth', modis: 'about 705 km', viirs: 'about 824 km' },
  { feature: 'Status in 2026', modis: 'Ending: satellites drifting, shutdown expected late 2026 / early 2027', viirs: 'Active: 3 satellites, more planned (JPSS-3 and JPSS-4)' },
]
