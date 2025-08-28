import { Kafka,Producer,Admin } from "kafkajs";


const kafka = new Kafka({
  clientId: "auth-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
  retry: {
    initialRetryTime:100,
    retries: 8
  }
});

//create producer instance

export const  kafkaProducer:Producer = kafka.producer({
    maxInFlightRequests: 1,//ensure message ordering
    idempotent: true,// prevent duplicate messages
    transactionTimeout:30000
});

const kafkaAdmin:Admin = kafka.admin();

//create required topics
export const createKafkaTopics = async (): Promise<void>=>{
  try{
    console.log("Creating Kafka topics...");
    await kafkaAdmin.connect();

    //check existing topics
    const existingTopics = await kafkaAdmin.listTopics();
    console.log("Existing Kafka topics:", existingTopics);

    const topicsToCreate = [
      {
        topic: 'user-events',
        numPartitions: 5,
        replicationFactor: 1,
        configEntries : [
           { name: 'retention.ms', value: '604800000' }, // 7 days
          { name: 'cleanup.policy', value: 'delete' },
          { name: 'compression.type', value: 'snappy' }
        ]
      }
    ]
  const newTopics = topicsToCreate.filter(t => !existingTopics.includes(t.topic));

  if(newTopics.length > 0){
    await kafkaAdmin.createTopics({
      validateOnly:false,
      waitForLeaders:true,
      timeout:30000,
      topics: newTopics
    });
  console.log('✅ Topics created:', newTopics.map(t => t.topic).join(', '));
  }else{
    console.log('📋 All required topics already exist');
  }

   } catch (error) {
    console.error('❌ Failed to create topics:', error);
    throw error;
  } finally {
    await kafkaAdmin.disconnect();
  }  
};


// Initialize kafka connection 
export const initializeKafka = async (): Promise<void> => {
  try {
    console.log("🔄 Initializing Kafka...");
    
    // Step 1: Create topics first
    await createKafkaTopics();
    
    // Step 2: Connect producer
    console.log("🔗 Connecting to Kafka broker...");
    await kafkaProducer.connect();
    console.log("✅ Kafka producer connected successfully");
    
  } catch (error) {
    console.error("❌ Error connecting to Kafka broker:", error);
    throw new Error(`Kafka connection failed: ${error}`);
  }
};
//Health check function
export const disconnectKafka = async (): Promise<void> =>{
  try{
    await kafkaProducer.disconnect();
    console.log("Kafka producer disconnected.");
  } catch (error) {
    console.error("Error disconnecting from Kafka broker:", error);
  }
}

export const isKafkaHealthy = async (): Promise<boolean> => {
  try {
    const admin = kafka.admin();
    await admin.connect();
    await admin.listTopics();
    await admin.disconnect();
    return true;
  } catch (error) {
    console.error("Kafka health check failed:", error);
    return false;
  }
};
