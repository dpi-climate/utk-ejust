from pyproj import Transformer
import xarray as xr
import json
from netCDF4 import Dataset
import numpy as np
import os

def thematic_from_netcdf(file_path, variables, coords, layer_id, operations=[], time_indexes=[], bbox={}):
    ncData = Dataset(file_path)
    
    lat_arr = []
    lon_arr = []

    if len(ncData.variables[coords['lat']].shape) == 1:
        lat_arr = ncData.variables[coords['lat']]
    
    else:
        lat_matrix = ncData.variables[coords['lat']][:][0]
        lat_arr = np.array([row[0] for row in lat_matrix] )

    if len(ncData.variables[coords['lon']].shape) == 1:
        lon_arr = ncData.variables[coords['lon']]
    
    else:
        lon_arr = ncData.variables[coords['lon']][:][0][0]

    min_lat_idx = 0
    max_lat_idx = len(lat_arr)-1
        
    min_lon_idx = 0
    max_lon_idx = len(lon_arr)-1

    if bbox:
        min_lat_idx = None
        max_lat_idx = None
            
        min_lon_idx = None
        max_lon_idx = None

        for i in range(len(lat_arr)):
            if min_lat_idx is None and lat_arr[i] >= bbox['min_lat'] >=bbox['min_lat']:
                min_lat_idx = i

            elif max_lat_idx is None and lat_arr[i] >= bbox['max_lat'] >=bbox['max_lat']:
                max_lat_idx = i
                break

        for i in range(len(lon_arr)):
            if min_lon_idx is None and lon_arr[i] >= bbox['min_lon'] >=bbox['min_lon']:
                min_lon_idx = i

            elif max_lon_idx is None and lon_arr[i] >= bbox['max_lon'] >=bbox['max_lon']:
                max_lon_idx = i
                break


        # lat_idxs = [i for i in range(len(lat_arr)) if lat_arr[i] >= bbox['min_lat'] and lat_arr[i] <= bbox['max_lat']]
        # lon_idxs = [j for j in range(len(lon_arr)) if lon_arr[j] >= bbox['min_lon'] and lon_arr[j] <= bbox['max_lon']]
    
        # min_lat_idx = lat_idxs[0]
        # max_lat_idx = lat_idxs[-1]
        
        # min_lon_idx = lon_idxs[0]
        # max_lon_idx = lon_idxs[-1]

############################################################################################
    
    # data = ncData.variables[variables[0]['name']][:]
    # new_data = np.array(data, copy=True)

    # # addition = lambda a, b: a + b
    # # multiplication = lambda a, b: a * b
    # # division = lambda a, b: a / b

    # apply_scalar = None
    # apply_vector = None

    # if operations['scalar']:
    #     apply_scalar = eval(operations['scalar']['function'])
        
    #     for matrix in new_data:
    #         for row in matrix:
    #             for i in range(len(row)):
    #                 row[i] = float(round(apply_scalar(row[i], operations['scalar']['parameters']), 2))

    # print(data[0][0][0], new_data[0][0][0])

    #############################################################################

    # for operation in operations:
    #     if operation['type'] == 'vector':
    #         if operation['function'] == 'sum':
    #             data = None

    #             for v in operation['variables']:
    #                 data = ncData.variables[v][:] if data is None else 
    #                 data.append(ncData.variables[v][:])


    # if len(operations['scalar']) > 0:
    #     for matrix in new_data:
    #         for row in matrix:
    #             for i in range(len(row)):
    #                 for operation in operations['scalar']:
    #                     apply_scalar = eval(operation['name'])
    #                     row[i] = float(round(apply_scalar(row[i], operation['value']), 2))

    # print(data[0][0][0], new_data[0][0][0])

    

############################################################################################


    # points = []
    # values = []
    # for latidx in range(min_lat_idx, max_lat_idx + 1):
    #     for lonidx in range(min_lon_idx, max_lon_idx + 1):
    #         points.append((lat_arr[latidx], lon_arr[lonidx]))
    #         pt_arr = []
            
    #         for tidx in range(len(data)):
    #             pt_arr.append(float(data[tidx][latidx][lonidx]))

    #         values.append(pt_arr)

    # coordinates = []
    # transformer = Transformer.from_crs(coords['proj'], 3395)

    # for point in transformer.itransform(points):
    #     coordinates.append(float(point[0]))
    #     coordinates.append(float(point[1]))
    #     coordinates.append(0)

    # abstract_json = {
    #     "id": layer_id,
    #     "coordinates": coordinates,
    #     "values": values
    # }

    # json_object = json.dumps(abstract_json)

    # directory = os.path.dirname(file_path)

    # with open(os.path.join(directory,layer_id+".json"), "w") as outfile:
    #     outfile.write(json_object)
    

  
    
    
    # if len(variables'] == 1):
    #     var_name = variables'][0]['name']
    #     var_unit = variables'][0]['unit']
    #     var_level = variable'][0]['level']
    #     var_key   = variable'][0]['key']


if __name__ == '__main__':   
    # myobj = json.load(open("./netcdf_grammarv1.json") )


    file_path = "../../examples/wrf_chicago/wrfout_d03_2023-06-09_20_00_00"
    variables = [ 'RAINC', 'RAINNC'
        # {
        #     "name": "T2",
        #     "level": "",
        #     "unit": "C",
        #     "key": ""
        # }
    ]

    coords = {
        "lat": "XLAT",
        "lon": "XLONG",
        "proj": 4326,
    }

    bbox = {
            "min_lat": 33,
            "min_lon": -94,
            "max_lat": 42,
            "max_lon": -81
        }

    # operations = {
    #         "scalar": [ 
    #             # {
    #             #     "name": "addition",
    #             #     "value": -273,
    #             # },
    #             # {
    #             #     "name": "multiplication",
    #             #     "value": 2,
    #             # },
    #             # {
    #             #     "name": "division",
    #             #     "value": 3,
    #             # },
    #             {
    #                 "name": "lambda x, l: (x + l[0]) * l[1]",
    #                 "value": [ -273, 2],
    #             }

    #         ],

    #         "vector": [
    #             # {
    #             #     "name": "",
    #             #     "parameters" : {
    #             #         "name": "",
    #             #         "value": ""

    #             #     }
    #             # }
    #         ]
    #     }

    # operations = {
    #     "scalar": {
    #         "function": "lambda x, l: (x + l[0]) * l[1]",
    #         "parameters": [-273, 2]
    #     },

    #     "vector" : {
    #         "type": "between_variables",
    #         "function": "lambda x, y: x + y",
    #         "parameters": [],
    #     }
        
        
    # }

    operations = [
        {
            "type": "vector",
            "function": "sum",
            "parameters": [],
        },
        {
            "type": "scalar",
            "function": "lambda x, l: (x + l[0]) * l[1]",
            "parameters": [-273, 2]
        },
    ]

    time_indexes = []
    layer_id = "wrfout_d03_2023-06-09_20_00_00_T2"

    # thematic_from_netcdf(file_path, variables, coords, operations, time_indexes, bbox)
    thematic_from_netcdf(file_path, variables, coords, layer_id, operations)

    # addMatrix = np.arange(3.0)
    # print(addMatrix)

# add_matrix = np.full((2, 3, 5), 7)
# print(add_matrix)