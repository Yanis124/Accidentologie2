var zoom=11




var carIcon = new L.Icon({ //Modify the marker
    iconUrl: '../images/marker.svg',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [40, 60],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

var southWest = L.latLng(35.712, -15.227)
var northEast = L.latLng(60.774, 15.125)
var bounds = L.latLngBounds(southWest, northEast);
var map
var locationBase=[48.862725, 2.247592]
var locationCenter=locationBase

function initMap(){  //Initialization of the map
    map=L.map("map",{
        fullscreenControl: true,
        //maxBounds: bounds,   
        fullscreenControlOptions: {
        position: 'topright'},
        wheelDebounceTime:0,
        wheelPxPerZoomLevel:50,
        minZoom:6,
        preferCanvas:true,
        
    }).setView(locationBase,11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy;<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);


   

      

    
    

    
    L.control.scale({   //Map dimensions
        metric:true,
        imperial:true,
        maxwidth:100,
        position:"bottomleft"
    }).addTo(map)

    map.on('zoom', ()=> {
        zoom=map.getZoom()
        drawVisibleMarkers()
        
    })

    map.on("moveend",async ()=>{    //get only visible markers
        
       
        let loadMarkers=getZoomMove()
        if(loadMarkers){
            drawVisibleMarkers()
        
           
        }
        
              
    }) 
}
async function drawVisibleMarkers(){
    map.scrollWheelZoom.disable();
    disableZoomControl()
    

    
    const visibleMarkers = getVisibleMarkers()
    
            

    //removePin()
    
    await loadCarte()
    await loadFiltre()

    await createPinMarker(visibleMarkers)  

    map.scrollWheelZoom.enable();
    enableZoomControl()
    


    await workCarte()
    await workFiltre()

}

var markerCluster=new L.markerClusterGroup( { animate: true,animateAddingMarkers: true})


function removePin(){  //Delete all markers
        markerCluster.clearLayers() 
}

var markers=[]

 
//Function to create a marker and the content of his popup.

async function createPin(){

    await loadCarte()  //loadCarte is an sync function because we display 50000 markers each 100ms
    await loadFiltre()

    
    if(!filtre){ //display all pins if we don't filter
        var list=listAccident
        if(list.length<=0){
            await getAccident()

            

            
         }
        
    }
    else{   
        var list=listAccidentFiltre
    }


    


    const record=50000
    
    let a
    let b
    let marker
    let pop
    

        
    
    
    

    markers=[]
    var markersInit=[]

    


    

    map.scrollWheelZoom.disable();

    disableZoomControl()
    disablePanning()

    for (let i = 0; i < list.length; i++) {

        
          
        try {
            a = list[i].fields.coordonnees[0]
            b = list[i].fields.coordonnees[1]
            
                
                    marker = L.marker([a, b], { icon: carIcon })
                
                
                    pop   = popUp(list[i])
                
                    marker.bindPopup(pop)
                    markers.push(marker)
                    markersInit.push(marker)
                

                
                
                if(i%record==0 && i>0){  //add only 100000 markers at once 
                    await addMarkers(markersInit)   
                    markersInit=[]
                }
                
                else if((list.length-1)==i && (i%record!=0)){ //add the rest of the markers

                    await addMarkers(markersInit)
                    markersInit=[]                
                }
            
            

        } 
        catch {
            
            if(i%record==0 && i>0){  //add only 100000 markers at once 
                await addMarkers(markersInit)
                markersInit=[]   
            }
            else if((list.length-1)==i && (i%record!=0)){ //add the rest of the markers

                await addMarkers(markersInit)
                markersInit=[]                
            }

            
            
        }
    }
    enableZoomControl()
    enablePanning()
    map.scrollWheelZoom.enable();

    

    workCarte()
    workFiltre()

    try{

        if((selectedRegion && selectedRegion!="toutes les regions") || (selectedDepartement && selectedDepartement!="tous les departements") || (selectedVille && selectedVille!="toutes les villes")){ //center the map to a specific location if a region | dep | ville is selected
            for(var i=0;i<list.length;i++){
                
                if(list[i].fields.coordonnees){
                    
                    setViewUser(list[i].fields.coordonnees)
                    
                    break
                }
            }
        }
    }
    catch{
        
    }

}

function setViewUser(listCoordonnees){   //center the map to a specific location
    map.setView(listCoordonnees,zoom, {  //make the animation smooth 
        "animate": true,
        "pan": {
          "duration": 1.5,
        }})
    }


async function addMarkers(markersInit){

    let visibleMarkers=getVisibleMarkers(markersInit)
    await createPinMarker(visibleMarkers)
    
    
    
}

async function createPinMarker(visibleMarkers){
    markerCluster.addLayers(visibleMarkers);
    map.addLayer(markerCluster);
    await loadCarte()
}



function getBoundMap(){
    const bounds = map.getBounds(); // Get current map bounds
    
    
    return bounds
}

function getVisibleMarkers(markersList=markers){
    
    let bounds=getBoundMap()
    const visibleMarkers = markersList.filter(marker =>
        bounds.contains(L.latLng(marker.getLatLng()))
        
      );
      
    return visibleMarkers
}
    //disable zoom control
function disableZoomControl() {  
    map.zoomControl.disable();
  }
  
  // enable zoom control
  function enableZoomControl() {
    map.zoomControl.enable();
  }

  function disablePanning() {
    map.dragging.disable();
  }
  
  // Function to enable panning (moving)
  function enablePanning() {
    map.dragging.enable();
  }

  function getZoomMove(){
     
    let center=map.getCenter()
    let zoom=map.getZoom()


    let distance = center.distanceTo(locationCenter);
    
    
    if((zoom>=16 && distance>200 ) || (zoom>=14 && distance>500 ) ||(zoom>=12 && distance>1000)||(zoom>=10 && distance>2000)||(zoom>=8 && distance>5000)|| (zoom>6 && distance>25000)|| (zoom>5 && distance>100000)){
        locationCenter=center
        return true
        
    }
    return false
  }
