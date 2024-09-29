package example.mssql.monitor;

import java.sql.PreparedStatement;
import java.sql.SQLException;

import org.springframework.jdbc.core.PreparedStatementSetter;

public class QuerySetter implements PreparedStatementSetter {
	private String[] inValues;
	
	public QuerySetter(String[] inValues) {
		this.inValues = inValues;
	}
	
	@Override
	public void setValues(PreparedStatement ps) throws SQLException {
		if(inValues == null)
			return;
		for(int i = 0; i < inValues.length; i++) {
		    ps.setString(i, inValues[i]);
		}
	}
}
