using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Data.SqlClient;
using Serilog;
using Serilog.Debugging;
using System.Data;
using Microsoft.IdentityModel.Tokens;

internal class Dataset
{
    public async Task execute(SqlConnection conn, string Name, string Statement, string Type, List<FieldSetting> Parameters)
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
            foreach (FieldSetting FieldSetting in Parameters)
            {
                SqlDbType DbType = (SqlDbType)Enum.Parse(typeof(SqlDbType), FieldSetting.DbType);
                cmd.Parameters.Add(FieldSetting.Name, DbType).Value = FieldSetting.Value;
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
        Fields["LogLineType"] = "DbMonitorDataset";
        Fields["DatasetName"] = Name;
        foreach (string column in columns)
        {
            Fields[column] = dataReader[column].ToString() ?? "";
        }

        string JsonString = JsonSerializer.Serialize(Fields);
        Log.Information(JsonString.Substring(1, JsonString.Length - 2));
    }
}

internal class FieldSetting
{
    public string Name { get; set; } = "";
    public string DbType { get; set; } = "VarChar";
    public string Value { get; set; } = "";
}

internal class DatasetSetting
{
    public string Name { get; set; } = "";
    public bool Enable { get; set; } = true;
    public string Type { get; set; } = "Query";
    public string Statement { get; set; } = "";
    public List<FieldSetting> Parameters { get; set; } = new List<FieldSetting>();
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
        var DatasetSettings = DataSetsSection.Get<List<DatasetSetting>>();
        if (DatasetSettings == null)
        {
            Log.Warning("No Datasets setup");
            return;
        }
        foreach(DatasetSetting DatasetSetting in DatasetSettings)
        {
            if(DatasetSetting == null || string.IsNullOrEmpty(DatasetSetting.Statement))
            {
                Log.Warning("No Datasets setup or Statement does not set");
                continue;
            }
            else if(!DatasetSetting.Enable)
            {
                Log.Debug("SQL Minotor DataSet: " + DatasetSetting.Name + " does not enable to query");
                continue;
            }
            else if (string.IsNullOrEmpty(DatasetSetting.Name))
            {
                Log.Warning("DataSet Name does not set");
                DatasetSetting.Name = "Unkown";
            }

            Dataset Dataset = new Dataset();
            await Dataset.execute(Conn, DatasetSetting.Name, DatasetSetting.Statement, DatasetSetting.Type, DatasetSetting.Parameters);
        }
    }
}