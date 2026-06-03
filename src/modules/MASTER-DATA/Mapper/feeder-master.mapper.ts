// Mapper/feeder-master.mapper.ts

export interface FeederMasterResponse{

success:boolean;

data:FeederMasterData;

}

export interface FeederMasterData{

items:FeederMasterItem[];

total:number;

page:number;

limit:number;

totalPages:number;

}

export interface FeederMasterItem{

slNo:number;

discomName:string|null;

regionName:string|null;

circleName:string|null;

divisionName:string|null;

zoneName:string|null;

substationName:string|null;

feederName:string;

dtrCount:number;

consumerCount:number;

}

export class FeederMasterMapper{

static mapData(
    data:FeederMasterData
):FeederMasterData{

return{

items:data.items??[],

total:data.total??0,

page:data.page??1,

limit:data.limit??20,

totalPages:data.totalPages??0

};

}

}