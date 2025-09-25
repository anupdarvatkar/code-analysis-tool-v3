from model.CodeMetadata import CodeMetadata
from genai.extract_java_metadata import extract_java_metadata
from graphdb.Neo4jConnector import Neo4jConnector
import time

def navigate_and_load(code_base: str):
    print(f"navigate_and_load started for {code_base}")

    import os
    metadata_collection = []

    debug_mode = False
    break_len = 3

    #Navigate the code with WALK
    for root, dirs, files in os.walk(code_base):
        for file in files:
            file_path = os.path.join(root, file)

            #Extract metadata from Java file
            if file.endswith('.java'):
                metadata = parse_java_metadata(file_path)
                time.sleep(0.25) #To avoid rate limit issues
                #print(f"Extracted Metadata: {metadata}")
                metadata_collection.append(metadata)
            
            #Extract metadata from Python 
            #TODO - Change to POM 
            elif file.endswith('.py'):
                #Python extraction
                print("Processing Python File")
            
            #Extract basic details of other types of files
            else: 
                #metadata = CodeMetadata(file_name=file)
                print(f"Skipping file: {file_path}")

            #Temporary break
            if debug_mode and len(metadata_collection) >= break_len:
                break;

        #Temporary break
        if debug_mode and len(metadata_collection) >= break_len:
                break;

    #Load data to Neo4j DB
    if metadata_collection:
        store_in_graphdb(metadata_collection)

    return


def parse_java_metadata(java_code_file: str):
    
    #Read file 
    with open(java_code_file, 'r', encoding='utf-8') as f:
        file_content = f.read()

    #print(f"\nJava File Content: {file_content}")
    #Call Gen AI powered solution to get the medatada
    metadata = extract_java_metadata(file_content)
    #ok = input("\nPress enter to continue...") 
    return metadata


def store_in_graphdb(metadata_collection):
    
    connector = Neo4jConnector()
    try:
        connector.save_code_metadata_collection(metadata_collection=metadata_collection)
    
    except Exception as e:
        print(f"Error in saving data to DB. Exception: {e}")

    finally:
        connector.close()

    return

def main():
    import os
    from dotenv import load_dotenv
    import sys

    load_dotenv()

    #Get the code base path from arg
    if len(sys.argv) >= 2:
        code_base = sys.argv[1]
    else:
        print("Code Base Path not passed as ARG, using from ENV")
        code_base = os.getenv('CODE_BASE_PATH')
        #print(f"Code Base from ENV: {code_base}")

    #If not available in ENV as well, raise and error
    if not code_base:
        raise ValueError('Code base path not passed as arg and not set in ENV')

    #Start the load process
    print(f"Load Process Started")
    navigate_and_load(code_base=code_base)
    print("Load Process Completed")


if __name__ == '__main__':
    main()

