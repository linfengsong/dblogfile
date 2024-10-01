package example.mssql.monitor;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import java.util.List;

@SpringBootApplication
public class DbMonitor implements CommandLineRunner {
	private static final Logger logger = LogManager.getLogger(DbMonitor.class);
	
	@Autowired
	private DatasetTemplate datasetTemplate;
	
	@Autowired
	private DbMonitorProperties dbMonitorProperties;
	
	static public void main(String[] args) {
		logger.debug("DbMonitor start");
		SpringApplication.run(DbMonitor.class, args);
		logger.debug("DbMonitor end");
	}
	 
	@Override
	public void run(String... strings) throws Exception {
		List<DbMonitorProperties.Dataset> datasets = dbMonitorProperties.getDatasets();
		for(DbMonitorProperties.Dataset dataset: datasets) {
			datasetTemplate.execute(dataset.name(), dataset.type(), dataset.statement(), dataset.parameters());
		}
	}
}
