from pyproj import Transformer
import pandas as pd
import os
import json
from netCDF4 import Dataset
import numpy as np
from .utils import *

import sys
from termcolor import colored
from wrf import getvar, interplevel, to_np, ALL_TIMES
from .wrfout_reader import WRFOutputReader

'''
    Converts a dataframe into an abstract layer
'''
def thematic_from_df(df, output_filepath, latitude_column, longitude_column, coordinates_projection, z_column = None, value_column=None):
    
    df = df.drop_duplicates(subset=[latitude_column, longitude_column])

    latitude_list = df[latitude_column].tolist()
    longitude_list = df[longitude_column].tolist()
    
    z_list = []
    if z_column != None:
       z_list = df[z_column].toList()

    if value_column != None:
        values_list = df[value_column].tolist()
    else:
        values_list = [1] * len(latitude_list)

    transformer = Transformer.from_crs(coordinates_projection, 3395)
    points = list(zip(latitude_list, longitude_list))

    coordinates = []

    for index, point in enumerate(transformer.itransform(points)):
    
        z_value = 0

        if(len(z_list) > 0):
            z_value = z_list[index]

        coordinates.append(point[0])
        coordinates.append(point[1])
        coordinates.append(z_value)

    abstract_json = {
        "id": os.path.basename(output_filepath),
        "coordinates": coordinates,
        "values": [elem for elem in values_list]
    }

    json_object = json.dumps(abstract_json)

    directory = os.path.dirname(output_filepath)
    if not os.path.exists(directory):
        os.makedirs(directory)
    
    with open(output_filepath, "w") as outfile:
        outfile.write(json_object)

'''
    Converts a csv file into an abstract layer
'''
def thematic_from_csv(filepath, layer_id, latitude_column, longitude_column, coordinates_projection, z_column = None, value_column=None):
    
    df = pd.read_csv(filepath)
    thematic_from_df(df, os.path.join(os.path.dirname(filepath),layer_id+".json"), latitude_column, longitude_column, coordinates_projection, z_column, value_column)

'''
    Converts a NetCDF (e.g. wrf data) file into an abstract layer
'''
def thematic_from_netcdf(filepath, layer_id, value_variable, latitude_variable, longitude_variable, coordinates_projection, timestep=None, bbox=[]):
    
    # Open the NetCDF file
    ncfile = Dataset(filepath)

    xlong = []
    xlat = []
    temp = []

    ## Data coords
    if(len(ncfile.variables[longitude_variable].shape) == 3 and timestep != None):
        xlong = ncfile.variables[longitude_variable][timestep]
    else:
        xlong = ncfile.variables[longitude_variable]

    if(len(ncfile.variables[latitude_variable].shape) == 3 and timestep != None):
        xlat = ncfile.variables[latitude_variable][timestep]
    else:
        xlat = ncfile.variables[latitude_variable]

    ## Data var
    if(len(ncfile.variables[value_variable].shape) == 3 and timestep != None):
        temp = ncfile.variables[value_variable][timestep]
    else:
        temp = ncfile.variables[value_variable]

    mask_values = []

    for i in range(len(xlat)):
        mask_values.append([])
        for j in range(len(xlat[i])):
            mask_values[i].append(False)

    if(len(bbox) > 0):

        longmin, longmax = bbox[1], bbox[3]
        latmin, latmax = bbox[0], bbox[2]

        ## Mask coordinates according to bounds
        latmask=np.ma.masked_where(xlat<latmin,xlat).mask+np.ma.masked_where(xlat>latmax,xlat).mask
        lonmask=np.ma.masked_where(xlong<longmin,xlong).mask+np.ma.masked_where(xlong>longmax,xlat).mask

        totmask = lonmask + latmask
        ## Apply mask to data
        temp_masked = np.ma.masked_where(totmask,temp)
        ## plot masked data

        mask_values = np.ma.getmask(temp_masked)

    coordinates = []
    values = []
    points = []

    transformer = Transformer.from_crs(coordinates_projection, 3395)

    for i, line in enumerate(mask_values):
        for j, masked in enumerate(line):
            if(not masked): # not masked

                points.append((xlat[i][j], xlong[i][j]))

                values.append(float(temp[i][j]))

    for point in transformer.itransform(points):

        coordinates.append(float(point[0]))
        coordinates.append(float(point[1]))
        coordinates.append(0)

    abstract_json = {
        "id": layer_id,
        "coordinates": coordinates,
        "values": values
    }

    json_object = json.dumps(abstract_json)

    directory = os.path.dirname(filepath)

    with open(os.path.join(directory,layer_id+".json"), "w") as outfile:
        outfile.write(json_object)

'''
    Converts a WRF output file into an abstract layer
'''

def thematic_from_wrf(filepath, variables_list, coordinates_projection, time_idxs=[], bbox=[]):
    transformer = Transformer.from_crs(coordinates_projection, 3395)

    wrfout = WRFOutputReader()
    wrfout.setNcData(filepath)
    wrfout.setAttributes()

    start_date = wrfout.getStartDate()
    grid_id = wrfout.getGridId()

    lat_array, lon_array = wrfout.getLatLon()

    n_lat, n_lon = wrfout.getGridDimensions()
    n_times = wrfout.getNTimes()

    lat_idxs = range(n_lat)
    lon_idxs = range(n_lon)
    
    latmin_idx = 0
    latmax_idx = n_lat-1
        
    lonmin_idx = 0
    lonmax_idx = n_lon-1

    if len(time_idxs) == 0: time_idxs = range(n_times)
    
    if(len(bbox) > 0):

        latmin, lonmin = bbox[0], bbox[1]
        latmax, lonmax = bbox[2], bbox[3]

        lat_idxs = [i for i in range(n_lat) if lat_array[i] >= latmin and lat_array[i] <= latmax]
        lon_idxs = [j for j in range(n_lon) if lon_array[j] >= lonmin and lon_array[j] <= lonmax]
       
        latmin_idx = lat_idxs[0]
        latmax_idx = lat_idxs[len(lat_idxs)-1]
        
        lonmin_idx = lon_idxs[0]
        lonmax_idx = lon_idxs[len(lon_idxs)-1]

    try:
        points = []

        for latidx in range(latmin_idx, latmax_idx + 1):
            for lonidx in range(lonmin_idx, lonmax_idx + 1):
                points.append((lat_array[latidx], lon_array[lonidx]))

        coordinates = []

        for point in transformer.itransform(points):
            coordinates.append(float(point[0]))
            coordinates.append(float(point[1]))
            coordinates.append(0)

    except Exception as error:
            msg = f"[thematic_from_wrf]\n{error}"
            print(colored(f"{msg}", "red"))
            sys.exit()
    
    for variable_key in variables_list:
        values = []
        data = wrfout.getVariable(variable_key)
        layer_id = f"{start_date}_d0{grid_id}_{variable_key}"
        
        try:
            for latidx in range(latmin_idx, latmax_idx + 1):
                for lonidx in range(lonmin_idx, lonmax_idx + 1):
                    pt_arr = [round(float(data[tidx][latidx][lonidx]), 2) for tidx in time_idxs]
                    values.append(pt_arr)
        
            abstract_json = {
                "id": layer_id,
                "coordinates": coordinates,
                "values": values
            }

            json_object = json.dumps(abstract_json)

            directory = os.path.dirname(filepath)

            with open(os.path.join(directory,layer_id+".json"), "w") as outfile:
                outfile.write(json_object)

        except Exception as error:
            msg = f"[thematic_from_wrf]\n{error}"
            print(colored(f"{msg}", "red"))
            sys.exit()

'''
    Thematic data from numpy array file 

    coordinates shape: (n,3)
    Considers that coordinates do not have a coordinates system but are in meters
'''
def thematic_from_npy(filepath_coordinates, filepath_values, layer_id, center_around=[]):

    coordinates = np.load(filepath_coordinates)
    values = np.load(filepath_values)

    coordinates = coordinates.flatten()

    if(len(center_around) > 0):
        coordinates = center_coordinates_around(coordinates, center_around)

    flat_values = []

    if(isinstance(values[0], np.ndarray)):
        flat_values = [item for row in values for item in row] 
    else:
        flat_values = values.tolist()

    abstract_json = {
        "id": layer_id,
        "coordinates": coordinates.tolist(),
        "values": flat_values
    }

    json_object = json.dumps(abstract_json)
    
    directory = os.path.dirname(filepath_coordinates)

    with open(os.path.join(directory,layer_id+".json"), "w") as outfile:
        outfile.write(json_object)