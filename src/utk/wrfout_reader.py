import sys
import numpy as np

from netCDF4 import Dataset
from termcolor import colored
from wrf import getvar, interplevel, to_np, ALL_TIMES
from pyproj import Transformer

class WRF_Output_Reader(object):
    def __init__(self) -> None:
        self.__className = "WRF_Output_Reader"
        self.resetClass()
        
    def get_ntimes(self):
        return self.__nTimes
    
    def getVariable(self, var_key, time_indexes=[]):
        var_key = var_key.upper()
        # To do: validate var_key
        
        #### Get data
        data = []

        if len(time_indexes) > 0:
            try:
                data = np.ma.masked_array([self.__ncData.variables[var_key][:][tidx] for tidx in time_indexes])

            except Exception as error:
                msg = f"[{self.__className} - getData]\n{error}"
                print(colored(f"{msg}", "red"))
                sys.exit()
        
        else:
            data = self.__ncData.variables[var_key][:]
    
        #### Process Data
        if len(data) > 0:
            if var_key == 'T2':
                data = data - 273 # Kelvin to Celsius
                
                    
        return data
    
    def old_getData(self, varKey, timestep=None):
        varKey = varKey.upper()
        
        # To do: validate varKey
        data = self.__ncData.variables[varKey][:] if timestep is None else self.__ncData.variables[varKey][:][timestep]

        if varKey == 'T2':
            data = data - 273 # Kelvin to Celsius
                    
        return data
    
    def getLatLon(self):
        # return self.__latMatrix, self.__lonMatrix
        return self.__latList, self.__lonList
    
    def setNcData(self, ncFilePath):
        try:
            self.__ncData = Dataset(ncFilePath)

        except Exception as error:
            msg = f"[{self.__className} - setNcData]\n{error}"
            print(colored(f"{msg}", 'red'))
            sys.exit()

    def resetClass(self):
        self.__ncData = None
        self.__gridId = None
        self.__latList = None
        self.__lonList = None
        self.__nTimes = None
    
    def setAttributes(self):
        self.__latMatrix = sorted(self.__ncData.variables['XLAT'][:][0], key=lambda x: x[0], reverse=True)
        self.__lonMatrix = self.__ncData.variables['XLONG'][:][0]
        
        self.__latList = np.array([row[0] for row in self.__latMatrix] )
        self.__lonList = np.array(self.__lonMatrix[0])

        self.__nRows = self.__ncData.dimensions['south_north'].size
        self.__nCols = self.__ncData.dimensions['west_east'].size

        self.__nTimes = self.__ncData.dimensions['Time'].size

def thematic_from_wrf2(filepath, variables_list, coordinates_projection, time_indexes=[], bbox=[]):
    wrfout = WRF_Output_Reader()
    wrfout.setNcData(filepath)
    wrfout.setAttributes()

    lat_matrix, lon_matrix = wrfout.getLatLon()

    n_times = len(time_indexes) if len(time_indexes) > 0 else wrfout.get_ntimes()
    
    for variable_key in variables_list:
        variable_data = wrfout.getVariable(variable_key, time_indexes)
        mask_values = [[False * len(lon_matrix[0])] * len(lat_matrix)] * n_times
    
        if(len(bbox) > 0):

            longmin, longmax = bbox[1], bbox[3]
            latmin, latmax = bbox[0], bbox[2]

            ## Mask coordinates according to bounds
            latmask=np.ma.masked_where(lat_matrix<latmin,lat_matrix).mask+np.ma.masked_where(lat_matrix>latmax,lat_matrix).mask
            lonmask=np.ma.masked_where(lon_matrix<longmin,lon_matrix).mask+np.ma.masked_where(lon_matrix>longmax,lon_matrix).mask

            totmask = lonmask + latmask
            
            for i in len(mask_values):
                ## Apply mask to data
                masked_variable_data = np.ma.masked_where(totmask,variable_data[i])
                
                ## plot masked data
                mask_values[i] = np.ma.getmask(masked_variable_data)
        
        coordinates = []
        values = []
        points = []

        transformer = Transformer.from_crs(coordinates_projection, 3395)

        for t in range(len(mask_values)):
            for i, line in enumerate(mask_values[t]):
                for j, masked in enumerate(line):
                    if(not masked): # not masked
                        points.append((lat_matrix[i][j], lon_matrix[i][j]))
                        values.append(float(variable_data[t][i][j]))

    
def thematic_from_wrf(filepath, variables_list, coordinates_projection, time_indexes=[], bbox=[]):
    wrfout = WRF_Output_Reader()
    wrfout.setNcData(filepath)
    wrfout.setAttributes()

    lat_array, lon_array = wrfout.getLatLon()
    print(lat_array[0], lat_array[len(lat_array)-1])
    print(lon_array[0], lon_array[len(lon_array)-1])

    if(len(bbox) > 0):

        latmin, lonmin = bbox[0], bbox[1]
        latmax, lonmax = bbox[2], bbox[3]

        # lat_idx = np.where(lat_array>latmin and lat_array<latmax)
        # lon_idx = np.where(lon_array>lonmin and lon_array<lonmax, axis=1)
        lat_idx = [i for i in range(len(lat_array)) if lat_array[i] > latmin and lat_array[i] < latmax]
        
        print(lat_idx)
        # print(lon_idx)



    
if __name__ == '__main__':
    path = f'../../examples/wrf_chicago'
    startDate = "2016-07-01"
    gId = "2"

    filepath = f"{path}/wrfout_d0{gId}_{startDate}.nc"

    # wrfout = WRF_Output_Reader()
    # t = None
    # wrfout.setNcData(filepath)
    # wrfout.setAttributes()
    # t2 = wrfout.getData('T2', t)
    # print(len(t2))

    # thematic_from_wrf(filepath, ['T2'], 4326)
    thematic_from_wrf(filepath, ['T2'], 4326, range(1, 5), [33, -94, 42, -81])
