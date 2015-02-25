package com.nttdata.emea.nuoffice.recognita;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bitsinharmony.recognito.MatchResult;
import com.nttdata.emea.nuoffice.MapUtil;

public class ResultOptimizer<K> {

	
	private static final Logger log = LoggerFactory
			.getLogger(ResultOptimizer.class);


	private static final float M = 1.1f;
	
	public static <K> String amplify(List<MatchResult<K>> matches, int threshold) {
		Map<String, Integer> counter = new HashMap<String, Integer>();
		int i = 0;
		for (MatchResult<K> r : matches) {
			log.debug(r.getKey() + " - " + r.getName() + "=" + r.getLikelihoodRatio());
		};
		if (i<matches.size()) {
				if (matches.get(i).getName().equalsIgnoreCase(matches.get(i+1).getName())) 
						matches.get(i).setLikelihoodRatio((int) (matches.get(i).getLikelihoodRatio()*M));
			}
		
		if (matches.get(0).getLikelihoodRatio()>=threshold) return matches.get(0).getName()+"_"+matches.get(0).getLikelihoodRatio(); return null;
	}

	
	public static <K> String optimize(List<MatchResult<K>> matches, int threshold) {
		Map<String, Integer> counter = new HashMap<String, Integer>();
		for (MatchResult<K> r : matches) {
			log.debug(r.getKey() + " - " + r.getName() + "=" + r.getLikelihoodRatio());
			if (r.getLikelihoodRatio() >= threshold) addTo(counter, r.getName(), r.getLikelihoodRatio());
		};
		List<Entry<String, Integer>> result = MapUtil.getValuesAsSortedListDesc(counter);
		return result.isEmpty() ? "unknown _"+ "_" + matches.get(0).getName()+"_"+matches.get(0).getLikelihoodRatio() : result.get(0).getKey() + "_" + matches.get(0).getLikelihoodRatio();
	}

	private static <K> void addTo(Map<String, Integer> counter, String key,
			int likelihoodRatio) {
		try {
		} catch (Exception e) {
			log.warn(key.toString() +  " cannot not be split into key");
		}
		
		Integer i = counter.get(key);
		if (i == null)
			counter.put(key, new Integer(likelihoodRatio));
//		else
//			counter.put(key, new Integer(i.intValue() + likelihoodRatio));

	}

}
