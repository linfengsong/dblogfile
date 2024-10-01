package example.mssql.monitor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix="db-monitor")
public class DbMonitorProperties {
	static public record Dataset(String name, String type, boolean enable, String statement, HashMap<String, String> parameters) {};
	
	private List<Dataset> datasets = new ArrayList<>();
	
    public List<Dataset> getDatasets() {
        return datasets;
    }

    public void setDatasets(List<Dataset> datasets) {
        this.datasets = datasets;
    }
}
