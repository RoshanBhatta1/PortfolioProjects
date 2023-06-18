select *
from Covid_deaths cd 
;
-- Select data that we are going to be using

select location, date, total_cases, new_cases, total_deaths, population
from Covid_deaths cd 
order by 1,2;

-- Looking at Total cases vs Total Deaths
-- Shows likelihood of dying if you contract covid in your country
SELECT
  location,
  date,
  total_cases,
  total_deaths,
  (CAST(total_deaths AS float) / total_cases) * 100 AS DeathPercentage
FROM
  Covid_deaths
  where 
  location like '%states%' and 
  continent is not null
  and continent <> ''
;

-- Looking at total cases vs Population
SELECT
  location,
  date,
  total_cases,
  population ,
  (CAST(total_cases  AS float) / population) * 100 AS CasePercentage
FROM
  Covid_deaths
  where 
  location like '%Nepal%' and 
  continent is not NULL 
  and continent <> ''
;

-- Looking at countries with Highest Infection Rate compared to Population
SELECT
  location,
  population,
  MAX(Cast(total_cases as float)) AS HighestInfectionCount,
  MAX((CAST(total_cases AS float) / population)) * 100 AS CasePercentage
FROM
  Covid_deaths
  WHERE 
  continent is not NULL 
  and continent <> ''
GROUP BY
  location, population 
ORDER BY
  CasePercentage DESC;
 
 -- Showing the countries with highest death count per population
SELECT
  location,
  MAX(Cast(total_deaths  as float)) AS TotalDeathCount
  FROM
  Covid_deaths cd 
  WHERE 
  continent is not NULL 
  and continent <> ''
  GROUP BY
  location 
ORDER BY
  TotalDeathCount DESC;
 
 -- Let's Break things down by Continent
 ---- showing continents with the highest death count
 
 SELECT
  location ,
  MAX(Cast(total_deaths  as float)) AS TotalDeathCount
  FROM
  Covid_deaths cd 
  WHERE 
  continent is null or 
  continent like ''
  GROUP BY
  location
  ORDER BY
  TotalDeathCount DESC;
 
 -- Global Numbers
 
 select  sum(new_cases) as TotalCases, 
 sum(cast(new_deaths as int)) as TotalDeaths, 
 sum(cast(new_deaths as int))/sum(New_cases)*100 as Deathpercentage
 from Covid_deaths cd 
 where continent  is  not NULL 
 --group by date 
order by Deathpercentage Desc ;

-- Looking at Total Population vs Vaccination


-- Use CTE
WITH PopvsVac (Continent, Location, Date, Population, New_vaccinations, RollingPeopleVaccinated) AS
(
    SELECT
        cd.continent,
        cd.location,
        cd.date,
        cd.population,
        cast(cv.new_vaccinations as float),
        sum(cast(cv.new_vaccinations as float)) over (PARTITION by cd.location order by cd.location, cd.date) as RollingPeopleVaccinated
    FROM
        Covid_deaths cd
    JOIN
        "Covid Vax" cv ON cd.location = cv.location AND cd.date = cv.date
    WHERE
        cd.continent IS NOT NULL
        AND cd.continent <> ''
)
-- After this CTE, you can write another query to use the PopvsVac table
SELECT
    *,
    (RollingPeopleVaccinated / Population) * 100 AS VaccinationPercentage
FROM
    PopvsVac;
   

 
 -- Creating View to store data for later visualizations
 
 Create view PercentPopulationVaccination as
 SELECT
        cd.continent,
        cd.location,
        cd.date,
        cd.population,
        cast(cv.new_vaccinations as float),
        sum(cast(cv.new_vaccinations as float)) over (PARTITION by cd.location order by cd.location, cd.date) as RollingPeopleVaccinated
    FROM
        Covid_deaths cd
  JOIN
        "Covid Vax" cv ON cd.location = cv.location AND cd.date = cv.date
  WHERE
     cd.continent IS NOT NULL
     AND cd.continent <> '';
