# CS2300-database-project

## Data for each table checklist

All of the data is used to build the database on the fly
I manually compiled all of it. It took a long time
Since there is a lot, there may be mistakes, so please fix it if you see them

[x] Agent
[x] Containment Chamber
[x] Facility
[x] Incident
[x] Incident_MTF
[x] INCIDENT_PERSONNEL
[x] INCIDENT_SCP
[x] MOBILE_TASK_FORCE
[x] OBJECT_CLASS
[x] PERSONNEL
[x] PERSONNEL_ASSIGNMENT
[x] RESEARCHER
[x] SCP
[x] SCP_ASSIGNMENT
[x] SCP_VERSION
[x] SECURITY_CLEARANCE
[x] SECURITY_OFFICER

## Activate the python venev

```bash
source /workspace/.venv/bin/activate.fish
```

## Install the python packages

```bash
pip install -r requirements.txt
```

## Connect to the database

Go to the SQL Tools connection extention
Select MySQL
Put in these values

Connection name*: SCPDB
Server Address*: mysql-db
Port*: 3306
Database*: scp_db
Username*: scp_user
Password mode: Ask on connect

Then save the connection and open it, it will prompt you for a password. 
The password is `scp_password`

You should now be connected to the database

## Populating the database

I already did the table setup, creation, and deletion in `sql/init.sql`
First, go into that file and at the top, there should be a "run on active connection block"
Click that and it will create and setup all the databases
(Also, while you are testing, just clikc that button again to clear all the data out of the database. Very useful)

Now, we need to put the data into the database. I made a custom scripp to do just that

`cd sql` and run this command `python import_script.py`
That will populate the entire database using all the json data stored in `/data`

## Viewing and interacting with the database

Now that the database is populated, go back to the SQL Tools connection extention
You should see a green connection that says SCPDB, expand that to see the tables and views
You will now see all the created tables
If you expand a table, you can see what attributes it takes
If you want to see the data in a table, right click on the table you want and click "Show Table Records"

## MISC

In the `src/scripts` and `raw_scp_files` directories, I made a bunch of scripts to help me get and parse the data
You can delete or move them if you want. I just found them very useful