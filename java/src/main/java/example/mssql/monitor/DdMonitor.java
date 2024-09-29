package example.mssql.monitor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;
import org.springframework.boot.CommandLineRunner;
import java.util.ArrayList;
import java.util.HashMap;

@SpringBootApplication
public class DdMonitor implements CommandLineRunner {
	
	@Autowired
	private Environment env;
	
	@Autowired
	private MonitorTemplate monitorTemplate;

	static public void main(String[] args) {
		SpringApplication.run(DdMonitor.class, args);
	}
	
	@Override
	public void run(String... strings) throws Exception {
		String monitors = env.getProperty("dbMonitor.active-monitors");
		if( monitors == null || monitors.isEmpty()) {
			System.exit(1);
		}
		for(String monitorName: monitors.split(",")) {
			String type = env.getProperty("dbMonitor." + monitorName + ".type");
			String statement = env.getProperty("dbMonitor." + monitorName + ".statement");
            if(type == null || statement == null) {
            	continue;
            }
            if("execute".equals(type)) {
            	HashMap<String, Object> inParamMap = getParameters(monitorName);
            	monitorTemplate.execute(monitorName, statement, inParamMap);
            }
            else if("query".equals(type)) {
            	String[] inValues = getValues(monitorName);
            	monitorTemplate.query(monitorName, statement, inValues);
            }
		}
	}
	
	private String[] getValues(String monitorName) {
		ArrayList<String> list = new ArrayList<String>();
    	String valueKey = "dbMonitor." + monitorName + ".values";
    	int i = 0;
    	String value = env.getProperty(valueKey + "[" + i  + "].value");
    	while(value != null) {
    		list.add(value);
    		i++;
    		value = env.getProperty(valueKey + "[" + i  + "].value");
    	}
    	return list.toArray(new String[list.size()]);
	}
	 
	private HashMap<String, Object> getParameters(String monitorName) {
		HashMap<String, Object> map = new HashMap<String, Object>();
    	String paramKey = "dbMonitor." + monitorName + ".parameters";
    	int i = 0;
    	String paramName = env.getProperty(paramKey + "[" + i  + "].name");
    	while(paramName != null) {
    		String paramValue = env.getProperty(paramKey + "[" + i  + "].value");
    		map.put(paramName, paramValue);
    		i++;
    	    paramName = env.getProperty(paramKey + "[" + i  + "].name");
    	}
    	return map;
	}
}
