import psycopg2

try:
    conn = psycopg2.connect(
        database="interviewdb",
        user="postgres",
        password="P05tg635",
        host="localhost",
        port="5432"
    )

    print("Connected successfully!")

    conn.close()

except Exception as e:
    print("Connection failed:")
    print(e)
