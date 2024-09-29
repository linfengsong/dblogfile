package example.mssql.monitor;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Component;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Component
public class MonitorTemplate  implements ResultSetExtractor<List<Map<String, Object>>>  {
	private static final Logger logger = LogManager.getLogger(MonitorTemplate.class);

	@Autowired
    protected JdbcTemplate jdbcTemplate;

    public void query(String queryName, String sql,  String[] inValues) {
    	QuerySetter setter = new QuerySetter(inValues);
    	List<Map<String, Object>> list = jdbcTemplate.query(sql, setter, this);
    	processList(queryName, list);
    }
    
	@Override
	public List<Map<String, Object>> extractData(ResultSet rs) throws SQLException, DataAccessException {
		int c = rs.getMetaData().getColumnCount();
		String[] names = new String[c];
		for(int i = 0; i < c; i++) {
			names[i] = rs.getMetaData().getColumnName(i + 1);
		}
		ArrayList<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
		while(rs.next()) {
		    HashMap<String, Object> map = new HashMap<String, Object>();
		    for(int i = 0; i < c; i++) {
			    String value = rs.getString(i + 1);
			    map.put(names[i], value);
		    }
		    list.add(map);
		}
		return list;
	}

    public void execute(String executeName, String storedProcedureName, Map<String, Object> inParamMap) throws SQLException {
    	MapSqlParameterSource in = new MapSqlParameterSource(inParamMap);
    	SimpleJdbcCall simpleJdbcCall = new SimpleJdbcCall(jdbcTemplate)
           .withProcedureName(storedProcedureName);
    	Map<String, Object> result = simpleJdbcCall.execute(in);
    	boolean bSingle = result.size() == 1;
    	for (Map.Entry<String, Object> entry : result.entrySet()) {
    		String entryKey = entry.getKey();
    		Object entryVal = entry.getValue();
    		String listName = storedProcedureName;
    		if(!bSingle)
    			listName = listName + "." + entryKey;
    		if(entryVal instanceof List<?>) {
    			List<?> list = (List<?>)entryVal;
    			processList(listName, list);
    		}	
    	}
    }
    
    private void processList(String listName, List<?> list) {
    	for(Object item: list) {
			processItem(listName, item);
		}
    }
    
    private void processItem(String listName, Object item) {
    	HashMap<String, Object> m = new HashMap<String, Object>();
    	m.put("logLineType", "dbMonitor");
    	if(listName != null) {
    		m.put("rsType", listName);
    	}
    	if(item instanceof Map) {
    		Map<?,?> map = (Map<?,?>)item;
    		for (Map.Entry<?, ?> entry : map.entrySet()) {
    			String name = String.valueOf(entry.getKey());
    			String value = String.valueOf(entry.getValue());
    			m.put(name, value);
    			//m = m.with(name, value);
    		}
    		JSONObject jsonObject = new JSONObject(map);
    	    String jsonData = jsonObject.toString();
    		logger.warn(jsonData);
    	}
    }
}