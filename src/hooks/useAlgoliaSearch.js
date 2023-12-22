// hooks/useAlgoliaSearch.js
import { useState, useMemo, useEffect, useCallback } from 'react';
import algoliasearch from 'algoliasearch/lite';
import algoliasearchHelper from 'algoliasearch-helper';

const useAlgoliaSearch = () => {
  const [results, setResults] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [location, setLocation] = useState(null);

  const client = useMemo(() => algoliasearch(process.env.REACT_APP_ALGOLIA_APP_ID,process.env.REACT_APP_ALGOLIA_API_KEY    ), []);

  
  const helper = useMemo(() => algoliasearchHelper(client,process.env.REACT_APP_ALGOLIA_INDEX_NAME    , {
    hitsPerPage: 1000,
    disjunctiveFacets: ['food_type', 'stars_count', 'payment_options'],
    getRankingInfo: true
  }), [client]);


  const handleSearch = useCallback((searchTerm) => {
    setCurrentSearchTerm(searchTerm);
    helper.clearRefinements();

    Object.entries(activeFilters).forEach(([filterType, filters]) => {
      Object.entries(filters).forEach(([filterValue, isActive]) => {
        if (filterType === 'payment_options') {

        } else{
  
        
        if (isActive) {
          // Check if filterValue is a number
          const isNumber = !isNaN(parseFloat(filterValue)) && isFinite(filterValue);
    
          if (isNumber) {
            // Assuming the operator and value you want to use are fixed ('>=', 4)
            helper.addNumericRefinement(filterType, '>=', filterValue);
          } else {
            // Original logic for non-numeric filters
            if (helper.state.disjunctiveFacets.includes(filterType)) {
              helper.addDisjunctiveFacetRefinement(filterType, filterValue);
            } else {
              helper.addFacetRefinement(filterType, filterValue);
            }
          }
        }
      }
    });
    });
    
    
    if (location) {
      helper.setQueryParameter('aroundLatLng', `${location.latitude}, ${location.longitude}`)
    }
    
    helper.setQuery(searchTerm);
    helper.search();

  }, [helper, activeFilters,location]);

  useEffect(() => {
    // console.log("Active Filters Updated:", activeFilters);
  }, [activeFilters]);

  useEffect(() => {
    // Function to get user's location
    const fetchLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.error("Error Code = " + error.code + " - " + error.message);
          }
        );
      } else {
        console.log("Geolocation is not supported by this browser.");
      }
    };

    fetchLocation();
  }, []);

  useEffect(() => {
    const handleResult = content => {
      setResults(content.results);
    };

    helper.on('result', handleResult);

    return () => {
      helper.removeListener('result', handleResult);
    };
  }, [helper]);



  const handleFilterChange = useCallback((filters) => {
    setActiveFilters(filters);
    // console.log("handleFilterChange called with filters:", filters); // Debug: Log when handleFilterChange is called

    handleSearch(currentSearchTerm);
  }, [currentSearchTerm, handleSearch]);

  return { results, handleSearch, handleFilterChange, setCurrentSearchTerm };
};

export default useAlgoliaSearch;
