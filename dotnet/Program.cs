using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Data.SqlClient;
using Serilog;
using Serilog.Debugging;
using System.Data;
using Microsoft.IdentityModel.Tokens;
using System;

internal class DataSet
{
    public async Task execute(SqlConnection conn, string Name, string Statement, string Type, Dictionary<string, string[]> Parameters)
    {
        if (Statement.IsNullOrEmpty())
        {
            Log.Error("DataSet Steatment does not set");
            return;
        }

        using var cmd = new SqlCommand(Statement, conn);
        if (Type.Equals("StoredProcedure"))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            foreach (KeyValuePair<string, string[]> entry in Parameters)
            {
                string Value = entry.Value[0];
                SqlDbType DbType = (SqlDbType)Enum.Parse(typeof(SqlDbType), entry.Value[1]);
                cmd.Parameters.Add(entry.Key, DbType).Value = Value;
            }
        } 
        else if (!Type.Equals("Query"))
        {
            Log.Error("DataSet Type: " + Type + " does not support");
        }
        using SqlDataReader DataReader = await cmd.ExecuteReaderAsync();
        await query(Name, DataReader);
    }

    private async Task query(string Name, SqlDataReader DataReader)
    {
        var Columns = new List<string>();
        for (int i = 0; i < DataReader.FieldCount; i++)
        {
            Columns.Add(DataReader.GetName(i));
        }

        while (await DataReader.ReadAsync())
        {
            writeRecord(Name, Columns, DataReader);
        }
    }

    private void writeRecord(string Name, List<string> columns, SqlDataReader dataReader)
    {
        var Fields = new Dictionary<string, string>();
        Fields["DbMonitorName"] = Name;
        foreach (string column in columns)
        {
            Fields[column] = dataReader[column].ToString() ?? "";
        }

        string JsonString = JsonSerializer.Serialize(Fields);
        Log.Information(JsonString.Substring(1, JsonString.Length - 2));
    }
}

internal class Program
{
    private static async Task Main(string[] args)
    {
        string env = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT") ?? "local";
        IConfiguration Configuration = new ConfigurationBuilder()
          .SetBasePath(Directory.GetCurrentDirectory())
          .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
          .AddJsonFile($"appsettings.{env}.json", optional: false, reloadOnChange: true)
          .AddEnvironmentVariables()
          .AddCommandLine(args)     
          .Build();

        string LogFilePath = Configuration.GetSection("Path:LogFilePath").Value ?? "dbmonitor.log.json";

        SelfLog.Enable(Console.Out);
        Log.Logger = new LoggerConfiguration()
            .WriteTo.File(LogFilePath, outputTemplate: "{{\"timestamp\":\"{Timestamp:yyyy-MM-dd HH:mm:ss.fff}\",\"Level\":\"{Level:u3}\",{Message:lj}}}{NewLine}{Exception}")
            .CreateLogger();

        Log.Debug("SQL Minotor Start");

        string ConnString = Configuration.GetSection("ConnectionStrings:DefaultConnection").Value ?? "";

        if (string.IsNullOrEmpty(ConnString))
        {
            Log.Error("Database Connection does not setup");
            System.Environment.Exit(1);
        }
        Log.Debug(ConnString);

        await using var Conn = new SqlConnection(ConnString);
        await Conn.OpenAsync();

        await runDatasets(Configuration.GetSection("DbMonitor:DataSets"), Conn);

        Log.Debug("SQL Minotor End");
        Log.CloseAndFlush();
    }

    private static async Task runDatasets(IConfigurationSection DataSetsSection, SqlConnection Conn)
    {
        var enm = DataSetsSection.GetChildren().GetEnumerator();
        while (enm.MoveNext())
        {
            var DataSetSection = enm.Current;
            var Name = DataSetSection.GetSection("Name").Value ?? "";
            var Enable = DataSetSection.GetSection("Enable").Value ?? "True";

            if(!Enable.Equals("True"))
            {
                Log.Debug("SQL Minotor DataSet: " + Name + " does not enable to query");
                continue;
            }

            if (string.IsNullOrEmpty(Name))
            {
                Log.Warning("DataSet Name does not set");
                Name = "Unkown";
            }

            var Type = DataSetSection.GetSection("Type").Value ?? "Query";
            var Statement = DataSetSection.GetSection("Statement").Value ?? "";
            var ParametersSection = DataSetSection.GetSection("Parameters");
            Dictionary<string, string[]> Parameters = new Dictionary<string, string[]>();
            var enmParam = ParametersSection.GetChildren().GetEnumerator();
            while (enmParam.MoveNext())
            {
                var ParameterSection = enmParam.Current;
                var ParameterName = ParameterSection.GetSection("Name").Value ?? "";
                var ParameterValue = ParameterSection.GetSection("Value").Value ?? "";
                var ParameterDbType = ParameterSection.GetSection("DbType").Value ?? "VarChar";
                Parameters[ParameterName] = new string[] { ParameterValue, ParameterDbType };
            }
            DataSet DataSet = new DataSet();
            await DataSet.execute(Conn, Name, Statement, Type, Parameters);
        }
    }
}