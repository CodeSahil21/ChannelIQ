import { kafkaProducer } from './kafkaManager';

export class KafkaManager {
  async publishMessage(topic: string, message: { key: string; value: string }) {
    try {
      await kafkaProducer.send({
        topic,
        messages: [message]
      });
    } catch (error) {
      console.error('Failed to publish message to Kafka:', error);
      throw error;
    }
  }
}